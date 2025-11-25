import { verifyToken } from '@/lib/jwt';
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  // Auth routes (public)
  const authRoutes = ['/login', '/signup'];
  const isAuthRoute = authRoutes.some(route => path.startsWith(route));

  // API routes (skip middleware) 
  if (path.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/albums',
    '/calendar',
    '/clients',
    '/analytics',
    '/documents',
    '/settings',
    '/profile'
  ];
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

  // If on auth routes and has valid token, redirect to home
  if (isAuthRoute && token && verifyToken(token)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If on protected route without token, redirect to login
  //   if (isProtectedRoute && !token) {
  //     return NextResponse.redirect(new URL('/login', request.url));
  //   }

  // If token exists but is invalid, redirect to login
  //   if (token && !verifyToken(token)) {
  //     const response = NextResponse.redirect(new URL('/login', request.url));
  //     response.cookies.delete('token');
  //     return response;
  //   }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
