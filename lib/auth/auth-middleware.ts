import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './jwt';

/**
 * Middleware function to verify JWT token from request headers or cookies
 * Used in protected API routes
 */
export function verifyAuth(request: NextRequest) {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get('authorization');
  let token: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7); // Remove 'Bearer ' prefix
  }

  // Fallback to cookie if no header token
  if (!token) {
    token = request.cookies.get('token')?.value || null;
  }

  if (!token) {
    return {
      valid: false,
      error: 'No token provided',
      status: 401,
      decoded: null,
    };
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return {
      valid: false,
      error: 'Invalid or expired token',
      status: 401,
      decoded: null,
    };
  }

  return {
    valid: true,
    error: null,
    status: 200,
    decoded,
  };
}

/**
 * Wrapper for protected API routes
 */
export function withAuth(
  handler: (
    request: NextRequest,
    userId: string
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const auth = verifyAuth(request);

    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    return handler(request, auth.decoded!.userId);
  };
}
