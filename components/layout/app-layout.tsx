'use client';

import * as React from 'react';
import { AppSidebar } from './app-sidebar';
import { AppHeader } from './app-header';
import { RoleProtection } from './role-protection';
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
    setSidebarOpen((prev) => !prev);
  };

  // // Initialize auth on mount - runs only once
  // React.useEffect(() => {
  //   const initAuth = async () => {
  //     await checkAuth();
  //     setHasInitialized(true);
  //   };
  //   initAuth();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []); // Empty dependency array ensures this runs only once



  // Show loading state during initial auth check
  // if (!hasInitialized) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  //     </div>
  //   );
  // }

  return (
    <RoleProtection>
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
    </RoleProtection>
  );
}
