// src/app/api/users/by-role/route.js
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    if (!role || !['Distributor', 'Dealer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid or missing role parameter' }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: {
        role: role,
      },
      select: { // Only send necessary data
        id: true,
        userId: true,
        name: true,
      },
    });

    return NextResponse.json(users);

  } catch (error) {
    console.error("Failed to fetch users by role:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 