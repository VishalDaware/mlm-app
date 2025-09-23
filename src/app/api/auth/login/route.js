// src/app/api/auth/login/route.js
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
// 1. Import 'SignJWT' from 'jose' instead of the old library
import { SignJWT } from 'jose';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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

    // This logic correctly handles both hashed and unhashed passwords
    const isPasswordCorrect = (user.password.length > 20) 
      ? await bcrypt.compare(password, user.password)
      : (password === user.password);

    if (!isPasswordCorrect || (role && user.role !== role)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 2. Prepare the secret key for 'jose'
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    // 3. Create the JWT using the 'jose' library
    const token = await new SignJWT({
        id: user.id,
        userId: user.userId,
        role: user.role,
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(secret);

    cookies().set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    const { password: userPassword, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}