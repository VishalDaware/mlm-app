// src/app/api/users/[userId]/downline/route.js
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    // First, find the parent user by their public userId to get their database ID
    const parentUser = await prisma.user.findUnique({
      where: { userId: params.userId },
    });

    if (!parentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Now, find all users whose 'uplineId' matches the parent user's database ID
    const downline = await prisma.user.findMany({
      where: { uplineId: parentUser.id },
      select: { // Select only the fields you want to send to the frontend
        id: true,
        userId: true,
        name: true,
        role: true,
      }
    });

    return NextResponse.json(downline);

  } catch (error) {
    console.error("Failed to fetch downline:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}