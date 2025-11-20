'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiClient } from '../api/client';
import { setTokens, clearTokens } from '../auth/tokens';
import { API_ENDPOINTS } from '../api/endpoints';
import type { LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth.types';

export async function loginAction(credentials: LoginCredentials) {
  const response = await ApiClient.post(
    API_ENDPOINTS.AUTH.LOGIN,
    credentials
  );

  // console.log( 'Login response:', response );

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error || 'Login failed',
    };
  }

  const { tokens } = response.data;
  await setTokens(tokens.accessToken, tokens.refreshToken);

  revalidatePath('/');
  redirect('/');
}

export async function registerAction(credentials: RegisterCredentials) {
  const response = await ApiClient.post(
    API_ENDPOINTS.AUTH.REGISTER,
    credentials
  );

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error || 'Registration failed',
    };
  }

  const { tokens } = response.data;
  await setTokens(tokens.accessToken, tokens.refreshToken);

  revalidatePath('/');
  redirect('/');
}

export async function logoutAction() {
  await ApiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {}, true);
  await clearTokens();
  revalidatePath('/');
  redirect('/login');
}

export async function getCurrentUserAction() {
  try {
    const response = await ApiClient.get(API_ENDPOINTS.AUTH.ME, true);

    console.log(response)
    
    if (!response.success) {
      return null;
    }

    return response.data;
  } catch (error) {
    return null;
  }
}