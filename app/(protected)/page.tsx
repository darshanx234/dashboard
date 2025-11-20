'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ImageIcon, Users, BarChart3, Plus, Link as LinkIcon, QrCode, Settings as SettingsIcon } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { Button } from '@/components/ui/button';
import { AlbumSelectionDialog } from '@/components/albums/album-selection-dialog';
import { User } from '@/lib/types/auth.types';
import { getCurrentUserAction } from '@/lib/actions/auth.action';

export default function Home() {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
const user = useAuthStore((state) => state.user);
 

  useEffect(() => {
    const fetchUserData = async () => {
      const userData = await getCurrentUserAction();
      // You can now use userdata here or set it to state
           if (userData?.user) {
        useAuthStore.getState().setUser(userData.user);
        setLoadingUser(false);
      }
    };
    fetchUserData();
  }, []);
  const photographerStats = [
    {
      title: 'Total Albums',
      value: '12',
      change: '+3 this month',
      icon: ImageIcon,
    },
    {
      title: 'Total Clients',
      value: '48',
      change: '+8 this month',
      icon: Users,
    },
    {
      title: 'Total Views',
      value: '2,845',
      change: '+342 this week',
      icon: BarChart3,
    },
    {
      title: 'Active Shares',
      value: '15',
      change: '5 expiring soon',
      icon: Activity,
    },
  ];

  const quickActions = [
    { title: 'Create New Album', icon: Plus, href: '/albums/create', action: null },
    // { title: 'Invite Client', icon: Users, href: '/clients', action: null },
    { title: 'Generate Share Link', icon: LinkIcon, href: null, action: () => setShareDialogOpen(true) },
    { title: 'Generate QR Code', icon: QrCode, href: null, action: () => setQrCodeDialogOpen(true) },
    { title: 'View Analytics', icon: BarChart3, href: '/analytics', action: null },
    { title: 'Manage Settings', icon: SettingsIcon, href: '/settings', action: null },
  ];

  if(loadingUser){
     return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.firstName || user?.email}! Here's an overview of your workspace.
          </p>
        </div>

        {/* Photographer Dashboard */}
        {user?.role === 'photographer' && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {photographerStats.map((stat) => (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.change}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your most recent uploads and client interactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No recent activity to display
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Frequently used actions and shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {quickActions.map((actionItem) => (
                      actionItem.href ? (
                        <Button
                          key={actionItem.title}
                          variant="outline"
                          className="w-full justify-start"
                          asChild
                        >
                          <a href={actionItem.href}>
                            <actionItem.icon className="mr-2 h-4 w-4" />
                            {actionItem.title}
                          </a>
                        </Button>
                      ) : (
                        <Button
                          key={actionItem.title}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={actionItem.action || undefined}
                        >
                          <actionItem.icon className="mr-2 h-4 w-4" />
                          {actionItem.title}
                        </Button>
                      )
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Client Dashboard would go here */}
        {user?.role === 'client' && (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to PhotoAlumnus</CardTitle>
              <CardDescription>
                View albums shared with you from the sidebar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Navigate to "My Albums" to view photos shared with you.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Admin Dashboard would go here */}
        {user?.role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Notice</CardTitle>
              <CardDescription>
                Access admin features from the admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Please navigate to the Admin Dashboard for platform management features.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Album Selection Dialog for Quick Share */}
      <AlbumSelectionDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} />
      
      {/* Album Selection Dialog for QR Code */}
      <AlbumSelectionDialog open={qrCodeDialogOpen} onOpenChange={setQrCodeDialogOpen} initialShowQR={true} />
    </AppLayout>
  );
}
