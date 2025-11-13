import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  role?: 'photographer' | 'client' | 'admin';
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  loginWithVerification: (email: string, password: string) => Promise<{ success: boolean; user?: User; token?: string; requiresVerification?: boolean; email?: string; otpExpiresAt?: string; error?: string }>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (loading) => set({ loading }),

      loginWithVerification: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include',
          });

          const data = await response.json();

          // If verification is required, return info for redirect
          if (!response.ok && response.status === 403 && data.requiresVerification) {
            return {
              success: false,
              requiresVerification: true,
              email: data.email,
              otpExpiresAt: data.otpExpiresAt,
            };
          }

          if (!response.ok) {
            // Handle unauthorized errors during login
            if (response.status === 401) {
              set({ user: null, token: null });
              localStorage.removeItem('auth-storage');
            }
            return {
              success: false,
              error: data.error || 'Login failed',
            };
          }

          set({
            user: data.user,
            token: data.token,
          });
          // Immediately check auth to ensure we have the latest user data
          setTimeout(() => {
            useAuthStore.getState().checkAuth();
          }, 100);
          return {
            success: true,
            user: data.user,
            token: data.token,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error?.message || 'Login failed',
          };
        } finally {
          set({ loading: false });
        }
      },

      signup: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include',
          });

          if (!response.ok) {
            const error = await response.json();
            
            // Handle unauthorized errors during signup
            if (response.status === 401) {
              set({ user: null, token: null });
              localStorage.removeItem('auth-storage');
            }
            
            throw new Error(error.error || 'Signup failed');
          }

          const data = await response.json();
          set({
            user: data.user,
            token: data.token,
          });
          
          // Immediately check auth to ensure we have the latest user data
          setTimeout(() => {
            useAuthStore.getState().checkAuth();
          }, 100);
        } catch (error) {
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      logout: async () => {
        set({ loading: true });
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });
        } finally {
          set({
            user: null,
            token: null,
            loading: false,
          });
          
          // Clear localStorage immediately
          localStorage.removeItem('auth-storage');
        }
      },

      checkAuth: async () => {
        set({ loading: true });
        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            set({ user: data.user });
          } else {
            // Handle unauthorized errors
            if (response.status === 401) {
              set({ user: null, token: null });
              localStorage.removeItem('auth-storage');
              
              // Redirect to login page if unauthorized
              if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
                window.location.href = '/login';
              }
            } else {
              set({ user: null, token: null });
            }
          }
        } catch (error) {
          set({ user: null, token: null });
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
