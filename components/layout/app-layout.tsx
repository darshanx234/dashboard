'use client';

import * as React from 'react';
import { AppSidebar } from './app-sidebar';
import { AppHeader } from './app-header';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

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
