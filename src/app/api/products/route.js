// src/app/api/products/route.js
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// GET all products (no changes here)
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST a new product (Admin only) - UPDATED
export async function POST(request) {
  try {
    // 1. Safely get the user payload string from headers
    const headersList = headers();
    const userPayloadString = headersList.get('X-User-Payload');

    // 2. Check if the payload exists before trying to parse it
    if (!userPayloadString) {
      return NextResponse.json({ error: 'Unauthorized: User payload not found in headers.' }, { status: 401 });
    }

    const userPayload = JSON.parse(userPayloadString);

    // 3. Check if the user is an Admin
    if (userPayload.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }

    const { name, price, stock } = await request.json();
    const newProduct = await prisma.product.create({
      data: { name, price: parseFloat(price), stock: parseInt(stock) },
    });
    return NextResponse.json(newProduct, { status: 201 });

  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}