// src/app/api/sales/route.js
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { productId, quantity, sellerId } = await request.json();
  
  const product = await prisma.product.findUnique({ where: { id: productId } });
  
  // Find the seller to get their role and uplineId
  const seller = await prisma.user.findUnique({ where: { id: sellerId } });

  if (!product || !seller || product.stock < quantity) {
    return NextResponse.json({ error: 'Product not available or insufficient stock' }, { status: 400 });
  }

  // Define commission rates
  const totalAmount = product.price * quantity;
  const sellerCommissionRate = seller.role === 'Dealer' ? 0.10 : 0.15; // 10% for Dealers, 15% for Distributors
  const uplineCommissionRate = 0.05; // 5% for the upline

  const sellerCommission = totalAmount * sellerCommissionRate;
  const uplineCommission = seller.uplineId ? totalAmount * uplineCommissionRate : 0;

  // Use a transaction to update stock and create the sale together
  const [, newSale] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    }),
    prisma.sale.create({
      data: {
        productId,
        sellerId,
        uplineId: seller.uplineId, // The crucial change is here
        quantity,
        totalAmount,
        sellerCommission,
        uplineCommission,
      },
    }),
  ]);

  return NextResponse.json(newSale, { status: 201 });
}