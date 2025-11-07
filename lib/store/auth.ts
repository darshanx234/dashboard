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
  role?: string;
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
  login: (email: string, password: string) => Promise<void>;
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

      login: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include', // Important: send cookies
          });

          if (!response.ok) {
            const error = await response.json();
            
            // Handle unauthorized errors during login
            if (response.status === 401) {
              set({ user: null, token: null });
              localStorage.removeItem('auth-storage');
            }
            
            throw new Error(error.error || 'Login failed');
          }

          const data = await response.json();
          set({
            user: data.user,
            token: data.token, // Backup token in state
          });
          
          // Immediately check auth to ensure we have the latest user data
          // This handles any potential cookie/state sync issues
          setTimeout(() => {
            useAuthStore.getState().checkAuth();
          }, 100);
        } catch (error) {
          throw error;
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
