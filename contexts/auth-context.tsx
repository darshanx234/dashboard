'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth';

interface AuthContextType {
  user: any;
  token: string | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authStore = useAuthStore();

  // useEffect(() => {
  //   // Check auth status on mount
  //   authStore.checkAuth();
  // }, []);

  const value: AuthContextType = {
    user: authStore.user,
    token: authStore.token,
    loading: authStore.loading,
    signUp: authStore.signup,
    signIn: authStore.login,
    signOut: authStore.logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
