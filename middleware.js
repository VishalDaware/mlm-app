// middleware.js
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Verify the token
    const { payload } = await jwtVerify(token, secret);

    // Attach the user payload to the request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('X-User-Payload', JSON.stringify(payload));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

// middleware.js
export const config = {
  matcher: [
    '/api/auth/me',
    '/api/products',          // For POST requests
    '/api/products/:path*',   // For PUT, DELETE requests
    '/api/sales',
    '/api/sales/:path*',
    '/api/users',
    '/api/users/:path*',
  ],
};