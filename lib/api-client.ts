import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';

/**
 * Handle unauthorized errors by redirecting to login
 */
function handleUnauthorizedError() {
  // Clear auth state
  useAuthStore.getState().setUser(null);
  useAuthStore.getState().setToken(null);
  
  // Clear localStorage
  localStorage.removeItem('auth-storage');
  
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

/**
 * Make authenticated API requests with token in Authorization header
 * Usage: const data = await apiWithAuth('/api/user/profile');
 */
export async function apiWithAuth<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const { token } = useAuthStore.getState();

  const headers = new Headers(options?.headers || {});
  headers.set('Content-Type', 'application/json');

  // Add token to Authorization header if available
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Always include cookies too
  });

  const data = await response.json();

  if (!response.ok) {
    // Handle unauthorized errors (401) or token-related errors
    if (response.status === 401 || 
        data.error?.toLowerCase().includes('unauthorized') ||
        data.error?.toLowerCase().includes('token') ||
        data.error?.toLowerCase().includes('invalid token') ||
        data.error?.toLowerCase().includes('expired token') ||
        data.error?.toLowerCase().includes('no token provided')) {
      handleUnauthorizedError();
      throw new Error('Unauthorized - redirecting to login');
    }
    
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

/**
 * Make authenticated GET request
 */
export async function getWithAuth<T>(url: string): Promise<T> {
  return apiWithAuth<T>(url, { method: 'GET' });
}

/**
 * Make authenticated POST request
 */
export async function postWithAuth<T>(
  url: string,
  body: any
): Promise<T> {
  return apiWithAuth<T>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Make authenticated PUT request
 */
export async function putWithAuth<T>(
  url: string,
  body: any
): Promise<T> {
  return apiWithAuth<T>(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * Make authenticated DELETE request
 */
export async function deleteWithAuth<T>(url: string, body?: any): Promise<T> {
  const options: RequestInit = { method: 'DELETE' };
  if (body) {
    options.body = JSON.stringify(body);
  }
  return apiWithAuth<T>(url, options);
}
