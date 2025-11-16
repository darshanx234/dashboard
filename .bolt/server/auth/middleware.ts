import { NextRequest, NextResponse } from 'next/server';
import { JWTManager } from './jwt';
import { AuthError } from '../errors/api-errors';

export async function withAuth(
  request: NextRequest,
  handler: (userId: string) => Promise<Response>
): Promise<Response> {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new AuthError('No token provided');
    }
    const payload = await JWTManager.verify(token);
    return await handler(payload.sub);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'Unauthorized: Invalid token' },
      { status: 401 }
    );
  }
}

export async function requireAuth(
  request: NextRequest
): Promise<{ userId: string; isValid: boolean; error?: string; code?: string }> {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new AuthError('No token provided');
    }
    const payload = await JWTManager.verify(token);
    return { userId: payload.sub, isValid: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { userId: '', isValid: false, error: error.message, code: error.code };
    }
    return { userId: '', isValid: false, error: 'Invalid token' };
  }
}