// src/app/api/auth/me/route.js
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const headerList = headers();
    const userPayloadString = headerList.get('X-User-Payload');

    if (!userPayloadString) {
      return new NextResponse(JSON.stringify({ error: 'Authentication token is missing or invalid' }), { status: 401 });
    }

    const userPayload = JSON.parse(userPayloadString);

    const user = await prisma.user.findUnique({ where: { id: userPayload.id } });

    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Invalid token or server error' }), { status: 401 });
  }
}