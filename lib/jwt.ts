import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your_refresh_secret_key';
const JWT_EXPIRE = (process.env.JWT_EXPIRE || '15m') as string;
const REFRESH_EXPIRE = (process.env.REFRESH_EXPIRE || '7d') as string;

export interface JWTPayload extends JwtPayload {
  userId: string;
  email: string;
  role?: 'photographer' | 'client' | 'admin';
}

export interface TokensPair {
  accessToken: string;
  refreshToken: string;
}

export function generateToken(payload: { 
  userId: string; 
  email: string;
  role?: 'photographer' | 'client' | 'admin';
}): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRE as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function generateRefreshToken(payload: { 
  userId: string; 
  email: string;
  role?: 'photographer' | 'client' | 'admin';
}): string {
  const options: SignOptions = {
    expiresIn: REFRESH_EXPIRE as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, REFRESH_SECRET, options);
}

export function generateTokens(payload: { 
  userId: string; 
  email: string;
  role?: 'photographer' | 'client' | 'admin';
}): TokensPair {
  return {
    accessToken: generateToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}
