// src/app/api/sales/user/[userId]/route.js
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    // Find the user by their public userId to get their database ID
    const user = await prisma.user.findUnique({
      where: { userId: params.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find all sales where the user was either the seller OR the upline
    const sales = await prisma.sale.findMany({
      where: {
        OR: [
          { sellerId: user.id },
          { uplineId: user.id },
        ],
      },
      orderBy: {
        createdAt: 'desc', // Show the most recent sales first
      }
    });

    return NextResponse.json(sales);

  } catch (error) {
    console.error("Failed to fetch sales for user:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}