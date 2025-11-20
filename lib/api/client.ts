import { getAccessToken, getRefreshToken, setTokens } from '../auth/tokens';
import { ApiError, ApiResponse } from '../types/api.types';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export class ApiClient {
  private static async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await getRefreshToken();
      
      if (!refreshToken) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (data.accessToken && data.refreshToken) {
        await setTokens(data.accessToken, data.refreshToken);
        return data.accessToken;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  static async request(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse> {
    const { requiresAuth = false, headers = {}, ...restOptions } = options;

    let accessToken: string | null = null;

    if (requiresAuth) {
      accessToken = await getAccessToken();

      if (!accessToken) {
        // Try to refresh token
        accessToken = await this.refreshAccessToken();
        
        if (!accessToken) {
          return {
            success: false,
            error: 'Authentication required',
          };
        }
      }
    }

    const requestHeaders : any = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (accessToken) {
      requestHeaders['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
        console.log(`${API_BASE_URL}${endpoint}`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...restOptions,
        headers: requestHeaders,
      });
      
      // console.log( await response.json())

      // If unauthorized, try to refresh token once
      if (response.status === 401 && requiresAuth) {
        const newAccessToken = await this.refreshAccessToken();
        
        if (newAccessToken) {
          requestHeaders['Authorization'] = `Bearer ${newAccessToken}`;
          
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...restOptions,
            headers: requestHeaders,
          });

          const data = await retryResponse.json();

          return {
            success: retryResponse.ok,
            data: retryResponse.ok ? data : undefined,
            error: !retryResponse.ok ? data.message || 'Request failed' : undefined,
          };
        }

        return {
          success: false,
          error: 'Session expired. Please login again.',
        };
      }

      const data = await response.json();
      console.log(data);

      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: !response.ok ? data.error || 'Request failed' : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  static async get(endpoint: string, requiresAuth = false) {
    return this.request(endpoint, { method: 'GET', requiresAuth });
  }

  static async post(endpoint: string, body: any, requiresAuth = false) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      requiresAuth,
    });
  }

  static async put(endpoint: string, body: any, requiresAuth = false) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      requiresAuth,
    });
  }

  static async delete(endpoint: string, requiresAuth = false) {
    return this.request(endpoint, { method: 'DELETE', requiresAuth });
  }

  static async patch(endpoint: string, body: any, requiresAuth = false) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      requiresAuth,
    });
  }
}