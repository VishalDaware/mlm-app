import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
// ADD THESE TWO LINES
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
    const users = await prisma.user.findMany({
      where: { role: { not: 'Admin' } }
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request) {
  const { name, role, uplineId, userId: customUserId } = await request.json();

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password', salt);

  const newUser = await prisma.user.create({
    data: {
      name,
      role,
      password: hashedPassword,
      userId: customUserId || `${role.substring(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`,
      uplineId: uplineId !== 'admin' ? uplineId : null,
    },
  });

  const { password, ...userWithoutPassword } = newUser;
  return NextResponse.json(userWithoutPassword, { status: 201 });
}

