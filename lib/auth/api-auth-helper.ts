import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../jwt';
import type { JWTPayload } from '../jwt';

export interface AuthResult {
  success: boolean;
  user: JWTPayload | null;
  error?: string;
  status?: number;
}

/**
 * Extract and verify JWT token from request headers or cookies
 * Returns standardized auth result for use in protected API routes
 */
export function getAuthUser(request: NextRequest): AuthResult {
  try {
    // Try to get token from Authorization header first (Bearer token)
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7); // Remove 'Bearer ' prefix
    }

    // Fallback to cookie if no header token
    if (!token) {
      token = request.cookies.get('token')?.value || null;
    }

    // No token found
    if (!token) {
      return {
        success: false,
        user: null,
        error: 'Authentication required. No token provided.',
        status: 401,
      };
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return {
        success: false,
        user: null,
        error: 'Invalid or expired token. Please login again.',
        status: 401,
      };
    }

    // Success
    return {
      success: true,
      user: decoded,
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      success: false,
      user: null,
      error: 'Authentication verification failed.',
      status: 500,
    };
  }
}

/**
 * Higher-order function to protect API routes with authentication
 * Usage: export const GET = withAuthProtection(async (request, user) => { ... });
 */
export function withAuthProtection(
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = getAuthUser(request);

    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: auth.status || 401 }
      );
    }

    try {
      return await handler(request, auth.user);
    } catch (error) {
      console.error('Protected route handler error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Higher-order function to protect API routes with role-based access control
 * Usage: export const GET = withRoleProtection(['photographer', 'admin'], async (request, user) => { ... });
 */
export function withRoleProtection(
  allowedRoles: Array<'photographer' | 'client' | 'admin'>,
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return withAuthProtection(async (request: NextRequest, user: JWTPayload) => {
    // Check if user has required role
    if (!user.role || !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { 
          error: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${user.role || 'none'}` 
        },
        { status: 403 }
      );
    }

    return handler(request, user);
  });
}

/**
 * Utility function to create unauthorized response
 */
export function createUnauthorizedResponse(message?: string): NextResponse {
  return NextResponse.json(
    { error: message || 'Unauthorized access' },
    { status: 401 }
  );
}

/**
 * Utility function to create forbidden response
 */
export function createForbiddenResponse(message?: string): NextResponse {
  return NextResponse.json(
    { error: message || 'Forbidden access' },
    { status: 403 }
  );
}

/**
 * Check if user is photographer or admin (for album management)
 */
export function canManageAlbums(user: JWTPayload): boolean {
  return user.role === 'photographer' || user.role === 'admin';
}

/**
 * Check if user is admin
 */
export function isAdmin(user: JWTPayload): boolean {
  return user.role === 'admin';
}

/**
 * Check if user owns the resource or is admin
 */
export function canAccessResource(user: JWTPayload, resourceUserId: string): boolean {
  return user.userId === resourceUserId || user.role === 'admin';
}