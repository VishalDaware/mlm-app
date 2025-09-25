// src/app/api/payouts/user/[userId]/route.js
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { userId } = params;

    const user = await prisma.user.findUnique({
      where: { userId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch sales and payouts in parallel
    const [sales, payouts] = await Promise.all([
      prisma.sale.findMany({
        where: { OR: [{ sellerId: user.id }, { uplineId: user.id }] },
      }),
      prisma.payout.findMany({
        where: { userId: user.id },
      }),
    ]);

    // Calculate total earnings
    const totalEarnings = sales.reduce((acc, sale) => {
      if (sale.sellerId === user.id) return acc + sale.sellerCommission;
      if (sale.uplineId === user.id) return acc + sale.uplineCommission;
      return acc;
    }, 0);

    // Calculate total paid
    const totalPaid = payouts.reduce((acc, payout) => acc + payout.amount, 0);

    const pendingBalance = totalEarnings - totalPaid;

    return NextResponse.json({ pendingBalance });

  } catch (error) {
    console.error("Failed to fetch pending payout:", error);
    return NextResponse.json({ error: 'Failed to fetch pending payout' }, { status: 500 });
  }
}