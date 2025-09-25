// src/app/api/sales/route.js
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Helper function to get user details from the session token
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

// GET function to retrieve all sales (for Admin Analytics)
export async function GET(request) {
  try {
    const user = await getUserFromToken();
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const sales = await prisma.sale.findMany();
    return NextResponse.json(sales);
  } catch (error) {
    console.error("Failed to fetch sales:", error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

// POST function to create a new sale
export async function POST(request) {
  const { productId, quantity, sellerId } = await request.json();
  const product = await prisma.product.findUnique({ where: { id: productId } });
  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!product || !seller || product.stock < quantity) {
    return NextResponse.json({ error: 'Product not available or insufficient stock' }, { status: 400 });
  }
  const totalAmount = product.price * quantity;
  const sellerCommissionRate = seller.role === 'Dealer' ? 0.10 : 0.15;
  const uplineCommissionRate = 0.05;
  const sellerCommission = totalAmount * sellerCommissionRate;
  const uplineCommission = seller.uplineId ? totalAmount * uplineCommissionRate : 0;
  const [, newSale] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    }),
    prisma.sale.create({
      data: {
        productId,
        sellerId,
        uplineId: seller.uplineId, 
        quantity,
        totalAmount,
        sellerCommission,
        uplineCommission,
      },
    }),
  ]);
  return NextResponse.json(newSale, { status: 201 });
}