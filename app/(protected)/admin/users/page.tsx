import { AppLayout } from '@/components/layout/app-layout';

export default function AdminUsersPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage photographers, clients, and user permissions
          </p>
        </div>

        <div className="grid gap-4">
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-lg font-semibold mb-2">All Users</h2>
            <p className="text-sm text-muted-foreground">
              User management interface will appear here
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
