import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';

export interface JWTPayload {
  jti: string;
  sub: string;
  email: string;
  exp: number;
  iat: number;
}

export class JWTManager {
  static async sign(payload: Omit<JWTPayload, 'exp' | 'iat'>): Promise<string> {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + (JWT_EXPIRES_IN === '1h' ? 3600 : 3600); // 1 hour default

    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .sign(secret);
  }

  static async verify(token: string): Promise<any> {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      return payload 
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static async refresh(currentToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const payload = await this.verify(currentToken);
      const newToken = await this.sign({
        jti: payload.jti,
        sub: payload.sub,
        email: payload.email,
      });
      return { token: newToken, refreshToken: newToken };
    } catch (error) {
      throw new Error('Token refresh failed');
    }
  }

  static setTokens(token: string, refreshToken: string) {
    cookies().set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
    });

    cookies().set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 604800, // 7 days
    });
  }

  static clearTokens() {
    cookies().delete('token');
    cookies().delete('refreshToken');
  }

  static getTokens(): { token?: string; refreshToken?: string } {
    return {
      token: cookies().get('token')?.value,
      refreshToken: cookies().get('refreshToken')?.value,
    };
  }
}