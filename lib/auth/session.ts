import { cache } from 'react';
import { getAccessToken, verifyToken } from './tokens';
import { User } from '../types/auth.types';

export const getCurrentUser = cache(async (): Promise<any> => {
  try {
    const token = await getAccessToken();
    
    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);
    
    if (!payload) {
      return null;
    }

    return payload ;
  } catch (error) {
    return null;
  }
});

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}