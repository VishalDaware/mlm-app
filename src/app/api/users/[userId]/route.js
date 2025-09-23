// src/app/api/sales/user/[userId]/route.js
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { userId } = params;

    // Case-insensitive find
    const user = await prisma.user.findFirst({
      where: {
        userId: {
          equals: userId,
          mode: 'insensitive'
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sales = await prisma.sale.findMany({
      where: {
        OR: [
          { sellerId: user.id },
          { uplineId: user.id },
        ],
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Failed to fetch sales for user:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
