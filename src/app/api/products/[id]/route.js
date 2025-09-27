import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Helper function to get authenticated user
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

// PUT (update) a product's details (Admin only)
export async function PUT(request, { params }) {
  try {
    const userPayload = await getUserFromToken();
    if (!userPayload || userPayload.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    // NOTE: We no longer accept 'stock' here. Stock is managed separately.
    const { name, franchisePrice, distributorPrice, subDistributorPrice, dealerPrice, farmerPrice } = await request.json();
    
    // Only update the product's pricing and name information.
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { 
        name, 
        // NO 'stock' field here
        franchisePrice: parseFloat(franchisePrice), 
        distributorPrice: parseFloat(distributorPrice), 
        subDistributorPrice: parseFloat(subDistributorPrice), 
        dealerPrice: parseFloat(dealerPrice), 
        farmerPrice: parseFloat(farmerPrice),
      },
    });
    return NextResponse.json(updatedProduct);

  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE a product and all its related records safely (Admin only)
export async function DELETE(request, { params }) {
    const userPayload = await getUserFromToken();
    if (!userPayload || userPayload.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    try {
        const { id } = params;

        // Use a transaction to ensure all related data is deleted before the product itself
        await prisma.$transaction(async (tx) => {
            // Step 1: Delete all inventory records for this product
            await tx.userInventory.deleteMany({
                where: { productId: id },
            });

            // Step 2: Delete all transaction history for this product
            await tx.transaction.deleteMany({
                where: { productId: id },
            });

            // Step 3: Now it's safe to delete the product itself
            await tx.product.delete({
                where: { id },
            });
        });

        return new NextResponse(null, { status: 204 }); // 204 No Content is standard for a successful DELETE

    } catch (error) {
        console.error("Failed to delete product:", error);
        return NextResponse.json({ error: 'Failed to delete product and its related records' }, { status: 500 });
    }
}
