'use client';

import * as React from 'react';
import { AppSidebar } from './app-sidebar';
import { AppHeader } from './app-header';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/auth';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [hasInitialized, setHasInitialized] = React.useState(false);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const loading = useAuthStore((state) => state.loading);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => { console.log("hello"); return !prev});
  };

  // Initialize auth on mount
  React.useEffect(() => {
    console.log("call twise")
    const initAuth = async () => {
      await checkAuth();
      setHasInitialized(true);
    };
    initAuth();
  }, [checkAuth]);

  

  // Show loading state during initial auth check
  if (!hasInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div className={cn(
        'transition-all duration-300 ease-in-out',
        'lg:pl-64'
      )}>
        <AppHeader onToggleSidebar={toggleSidebar} />

        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
