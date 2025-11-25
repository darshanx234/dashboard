import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Role-based route protection configuration
 * Define which routes are accessible by which roles
 */
const roleRoutes = {
  photographer: [
    '/',
    '/albums',
    '/analytics',
    '/clients',
    '/documents',
    '/settings',
    '/profile',
    '/calendar'
  ],
  client: [
    '/my-albums',
    '/favorites',
    '/downloads',
    '/settings',
    '/profile',
  ],
  admin: [
    '/admin',
    '/admin/dashboard',
    '/admin/users',
    '/admin/albums',
    '/admin/reports',
    '/admin/settings',
    '/settings',
    '/profile',
  ],
};

/**
 * Check if a role has access to a specific route
 */
export function hasRoleAccess(
  route: string,
  role: 'photographer' | 'client' | 'admin'
): boolean {
  const allowedRoutes = roleRoutes[role];

  // Check if route matches exactly or starts with an allowed route
  return allowedRoutes.some(
    (allowedRoute) => route === allowedRoute || route.startsWith(`${allowedRoute}/`)
  );
}

/**
 * Get the default home page for a role
 */
export function getDefaultHomePage(role: 'photographer' | 'client' | 'admin'): string {
  switch (role) {
    case 'photographer':
      return '/';
    case 'client':
      return '/my-albums';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/';
  }
}

/**
 * Redirect user to their role-appropriate home page
 */
export function redirectToRoleHome(role: 'photographer' | 'client' | 'admin'): NextResponse {
  const homePage = getDefaultHomePage(role);
  return NextResponse.redirect(new URL(homePage, process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'));
}
