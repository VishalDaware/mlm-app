// src/app/api/auth/login/route.js
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// FIX: Changed from 'export default async function' to 'export async function POST'
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, password, role } = body;

    const user = await prisma.user.findUnique({
      where: { userId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // This will be used when we create users with hashed passwords
    // const isPasswordCorrect = await bcrypt.compare(password, user.password);
    
    // For now, we use a simple check for the initial 'password'
    const isPasswordCorrect = (user.password.length > 20) 
      ? await bcrypt.compare(password, user.password)
      : (password === user.password);

    if (!isPasswordCorrect || (role && user.role !== role)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign(
      { id: user.id, userId: user.userId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    cookies().set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    const { password: userPassword, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}