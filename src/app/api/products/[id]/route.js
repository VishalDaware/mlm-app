// src/app/api/products/[id]/route.js
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// ✅ Using the same helper function for consistency
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

// PUT (update) a product (Admin only)
export async function PUT(request, { params }) {
  try {
    const userPayload = await getUserFromToken();
    if (!userPayload || userPayload.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const { name, price, stock } = await request.json();
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { 
        name, 
        price: parseFloat(price), 
        stock: parseInt(stock) 
      },
    });
    return NextResponse.json(updatedProduct);

  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE a product (Admin only)
export async function DELETE(request, { params }) {
  try {
    const userPayload = await getUserFromToken();
    if (!userPayload || userPayload.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { id } = params;
    await prisma.product.delete({ where: { id } });
    return new NextResponse(null, { status: 204 }); // 204 No Content is standard for a successful delete

  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}