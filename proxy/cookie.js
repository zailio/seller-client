// middleware.js
import { NextResponse } from 'next/server';
import config from '../utils/config';

export default function middleware(request) {
  const auth = request.cookies.get('AUTH-T');

  // If cookie doesn't exist, do nothing
  if (!auth) {
    return NextResponse.next();
  }

  // ⚠️ IMPORTANT:
  // Middleware CANNOT expand cookie scope.
  // This re-set only keeps it consistent.
  const response = NextResponse.next();
  const isProd = process.env.NODE_ENV === 'production';

  response.cookies.set({
    name: 'AUTH-T',
    value: auth.value,
    ...(isProd ? { domain: `.${config.domain}` } : {}),
    path: '/',
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 60 * 60 * 24 * 180,
  });
  return response;
}
