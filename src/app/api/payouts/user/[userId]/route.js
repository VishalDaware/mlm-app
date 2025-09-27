// src/app/api/payouts/user/[userId]/route.js
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { userId } = params;

    // 1. Find the user by their public userId to get their internal database ID
    const user = await prisma.user.findUnique({
      where: { userId: userId },
      select: { id: true }, // We only need the ID for the next queries
    });

    // If the user doesn't exist, it's a 404 error, not a server crash
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Fetch all transactions where this user was the seller, and all their payouts
    // Using Promise.all is more efficient as it runs both queries at the same time
    const [transactions, payouts] = await Promise.all([
      prisma.transaction.findMany({
        where: { sellerId: user.id },
        select: { profit: true }, // We only need the profit from each transaction
      }),
      prisma.payout.findMany({
        where: { userId: user.id },
        select: { amount: true }, // We only need the amount from each payout
      }),
    ]);

    // 3. Calculate the total profit earned by summing up the profit from all transactions
    const totalProfit = transactions.reduce((acc, transaction) => acc + transaction.profit, 0);

    // 4. Calculate the total amount already paid out
    const totalPaid = payouts.reduce((acc, payout) => acc + payout.amount, 0);

    // 5. The pending balance is the difference
    const pendingBalance = totalProfit - totalPaid;

    // 6. Return the result in a clean JSON object
    return NextResponse.json({ pendingBalance });

  } catch (error) {
    // This will catch any unexpected database errors and prevent the server from crashing
    console.error("Failed to fetch pending payout for user:", error);
    return NextResponse.json({ error: 'Failed to fetch pending payout data' }, { status: 500 });
  }
}