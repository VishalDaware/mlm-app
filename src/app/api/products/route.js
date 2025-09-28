import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Helper function to get the logged-in user
async function getUserFromToken() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// GET all products and CALCULATE their total stock
export async function GET(request) {
  try {
    // 1. Get all products from the catalog
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // 2. For each product, calculate the total stock by summing up all related UserInventory quantities
    const productsWithTotalStock = await Promise.all(
      products.map(async (product) => {
        const result = await prisma.userInventory.aggregate({
          where: { productId: product.id },
          _sum: {
            quantity: true,
          },
        });

        return {
          ...product,
          // Add the calculated total stock to the product object
          totalStock: result._sum.quantity || 0,
        };
      })
    );

    return NextResponse.json(productsWithTotalStock);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST a new product and assign its initial stock to the Admin
export async function POST(request) {
  try {
    const userPayload = await getUserFromToken();
    if (!userPayload || userPayload.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      stock,
      franchisePrice,
      distributorPrice,
      subDistributorPrice,
      dealerPrice,
      farmerPrice
    } = body;

    const stockQuantity = parseInt(stock, 10);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
        return NextResponse.json({ error: 'Invalid stock quantity.'}, { status: 400 });
    }

    const newProduct = await prisma.$transaction(async (tx) => {
      // Step 1: Create the product
      const createdProduct = await tx.product.create({
        data: {
          name,
          franchisePrice: parseFloat(franchisePrice),
          distributorPrice: parseFloat(distributorPrice),
          subDistributorPrice: parseFloat(subDistributorPrice),
          dealerPrice: parseFloat(dealerPrice),
          farmerPrice: parseFloat(farmerPrice),
        },
      });

      // Step 2: Assign the initial stock to the Admin
      if (stockQuantity > 0) {
          await tx.userInventory.create({
              data: {
                  userId: userPayload.id, // The Admin's ID
                  productId: createdProduct.id,
                  quantity: stockQuantity,
              }
          });
      }

      return createdProduct;
    });

    return NextResponse.json(newProduct, { status: 201 });

  } catch (error) {
    console.error("Failed to create product:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return NextResponse.json({ error: 'A product with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

