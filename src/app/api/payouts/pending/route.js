// src/app/api/payouts/pending/route.js
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

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

export async function GET(request) {
  try {
    const user = await getUserFromToken();
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Fetch all users who are eligible for payouts
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['Distributor', 'Dealer'] },
      },
      select: { id: true, userId: true, name: true, role: true },
    });

    // 2. Fetch all sales and payouts in parallel for efficiency
    const [allSales, allPayouts] = await Promise.all([
      prisma.sale.findMany({ select: { sellerId: true, sellerCommission: true, uplineId: true, uplineCommission: true } }),
      prisma.payout.findMany({ select: { userId: true, amount: true } }),
    ]);

    // 3. Calculate total earnings for each user
    const earningsMap = new Map();
    allSales.forEach(sale => {
      // Add seller commission
      if (sale.sellerId) {
        earningsMap.set(sale.sellerId, (earningsMap.get(sale.sellerId) || 0) + sale.sellerCommission);
      }
      // Add upline commission
      if (sale.uplineId) {
        earningsMap.set(sale.uplineId, (earningsMap.get(sale.uplineId) || 0) + sale.uplineCommission);
      }
    });

    // 4. Calculate total paid for each user
    const paidMap = new Map();
    allPayouts.forEach(payout => {
      paidMap.set(payout.userId, (paidMap.get(payout.userId) || 0) + payout.amount);
    });

    // 5. Combine the data to calculate pending balance
    const pendingPayouts = users.map(u => {
      const totalEarnings = earningsMap.get(u.id) || 0;
      const totalPaid = paidMap.get(u.id) || 0;
      const pendingBalance = totalEarnings - totalPaid;
      return {
        ...u,
        totalEarnings,
        totalPaid,
        pendingBalance,
      };
    }).filter(u => u.pendingBalance > 0); // Only return users with a pending balance

    return NextResponse.json(pendingPayouts);

  } catch (error) {
    console.error("Failed to fetch pending payouts:", error);
    return NextResponse.json({ error: 'Failed to fetch pending payouts' }, { status: 500 });
  }
}