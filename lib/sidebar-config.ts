import {
  LayoutDashboard,
  ImageIcon,
  BarChart3,
  Users,
  FileText,
  Settings,
  Heart,
  Download,
  Building2,
  User,
  Calendar,
  type LucideIcon,
} from 'lucide-react';

export interface MenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
}

export interface SidebarConfig {
  photographer: MenuItem[];
  client: MenuItem[];
  admin: MenuItem[];
}

export const sidebarConfig: SidebarConfig = {
  // Photographer Role - Main user who uploads and shares albums
  photographer: [
    {
      title: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      description: 'Stats, recent activity, quick actions',
    },
    {
      title: 'Albums',
      href: '/albums',
      icon: ImageIcon,
      description: 'Create, manage, upload photos',
    },
    {
      title: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      description: 'Views, downloads, favorites tracking',
    },
    {
      title: 'Clients',
      href: '/clients',
      icon: Users,
      description: 'List of client names linked to albums',
    },
    {
      title: 'Calendar',
      href: '/calendar',
      icon: Calendar,
      description: 'Event scheduling and calendar view',
    },
    {
      title: 'Documents',
      href: '/documents',
      icon: FileText,
      description: 'Invoices, agreements',
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'Profile, password, billing, API key',
    },
  ],

  // Client Role - Access through shared token/link with limited privileges
  client: [
    {
      title: 'My Albums',
      href: '/my-albums',
      icon: ImageIcon,
      description: 'Albums shared with you',
    },
    {
      title: 'Favorites',
      href: '/favorites',
      icon: Heart,
      description: 'Selected or proofed photos',
    },
    {
      title: 'Downloads',
      href: '/downloads',
      icon: Download,
      description: 'Previously downloaded sets',
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'Change password, manage email',
    },
  ],

  // Admin Role - System owner manages users, billing, reports
  admin: [
    {
      title: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      description: 'Platform metrics, revenue, users',
    },
    {
      title: 'Users',
      href: '/admin/users',
      icon: User,
      description: 'Manage photographers, ban/suspend',
    },
    {
      title: 'Albums',
      href: '/admin/albums',
      icon: ImageIcon,
      description: 'Overview of all albums',
    },
    {
      title: 'Reports',
      href: '/admin/reports',
      icon: BarChart3,
      description: 'Billing and usage stats',
    },
    {
      title: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      description: 'System configuration',
    },
  ],
};

/**
 * Get sidebar menu items based on user role
 */
export function getSidebarMenu(role?: 'photographer' | 'client' | 'admin'): MenuItem[] {
  if (!role) return [];
  return sidebarConfig[role] || [];
}

/**
 * Check if user has access to a specific route
 */
export function hasRouteAccess(
  route: string,
  role?: 'photographer' | 'client' | 'admin'
): boolean {
  if (!role) return false;
  const menuItems = getSidebarMenu(role);
  return menuItems.some((item) => route.startsWith(item.href));
}

/**
 * Get role-specific home route
 */
export function getRoleHomePage(role?: 'photographer' | 'client' | 'admin'): string {
  switch (role) {
    case 'photographer':
      return '/';
    case 'client':
      return '/my-albums';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/';
  }
}
