import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Helper function to get user from the token in the cookie
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
    // 1. Ensure the requester is an Admin
    const user = await getUserFromToken();
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Fetch all users eligible for payouts
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['Franchise', 'Distributor', 'SubDistributor', 'Dealer'] },
      },
      select: { id: true, userId: true, name: true, role: true },
    });

    // 3. Fetch all transactions and payouts
    const [allTransactions, allPayouts] = await Promise.all([
      prisma.transaction.findMany({ select: { sellerId: true, profit: true } }),
      prisma.payout.findMany({ select: { userId: true, amount: true } }),
    ]);

    // 4. Calculate total profit for each user
    const profitMap = new Map();
    allTransactions.forEach(transaction => {
      profitMap.set(transaction.sellerId, (profitMap.get(transaction.sellerId) || 0) + transaction.profit);
    });

    // 5. Calculate total paid for each user
    const paidMap = new Map();
    allPayouts.forEach(payout => {
      paidMap.set(payout.userId, (paidMap.get(payout.userId) || 0) + payout.amount);
    });

    // 6. Combine data to calculate the final pending balance for each user
    const pendingPayouts = users.map(u => {
      const totalProfit = profitMap.get(u.id) || 0;
      const totalPaid = paidMap.get(u.id) || 0;
      const pendingBalance = totalProfit - totalPaid;
      return {
        ...u,
        totalEarnings: totalProfit, // Renamed for consistency on the frontend
        totalPaid,
        pendingBalance,
      };
    }).filter(u => u.pendingBalance > 0); // Only return users who have a balance to be paid

    return NextResponse.json(pendingPayouts);

  } catch (error) {
    console.error("Failed to fetch pending payouts:", error);
    return NextResponse.json({ error: 'Failed to fetch pending payouts' }, { status: 500 });
  }
}

