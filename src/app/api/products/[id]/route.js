// src/app/api/products/[id]/route.js
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// PUT (update) a product (Admin only)
export async function PUT(request, { params }) {
  const userPayload = JSON.parse(headers().get('X-User-Payload'));
  if (userPayload.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = params;
  const { name, price, stock } = await request.json();
  const updatedProduct = await prisma.product.update({
    where: { id },
    data: { name, price: parseFloat(price), stock: parseInt(stock) },
  });
  return NextResponse.json(updatedProduct);
}

// DELETE a product (Admin only)
export async function DELETE(request, { params }) {
  const userPayload = JSON.parse(headers().get('X-User-Payload'));
  if (userPayload.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ message: 'Product deleted' }, { status: 200 });
}