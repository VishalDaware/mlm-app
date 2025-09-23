// src/app/api/users/route.js
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { name, role, uplineId, userId: customUserId } = await request.json();

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password', salt); // Default password 'password'

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