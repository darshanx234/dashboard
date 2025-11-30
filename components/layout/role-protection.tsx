'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { hasRoleAccess, getDefaultHomePage } from '@/lib/auth/role-access';

interface RoleProtectionProps {
  children: React.ReactNode;
}

/**
 * Role-based route protection component
 * Redirects users to their appropriate home page if they don't have access
 */
export function RoleProtection({ children }: RoleProtectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Skip protection for login/signup pages
    if (pathname === '/login' || pathname === '/signup') {
      return;
    }

    // Wait for user to be loaded
    if (!user) {
      return;
    }

    const userRole = user.role || 'photographer';

    // Check if user has access to current route
    if (!hasRoleAccess(pathname, userRole)) {
      console.log(`Access denied to ${pathname} for role: ${userRole}`);
      
      // Redirect to role-appropriate home page
      const homePage = getDefaultHomePage(userRole);
      console.log(homePage, "home");
      router.push(homePage);
    }
  }, [pathname, user, router]);

  return <>{children}</>;
}
