import { AppLayout } from '@/components/layout/app-layout';

export default function AdminDashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Platform metrics, revenue, and user statistics
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="text-sm font-medium text-muted-foreground">Total Albums</h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
            <p className="text-3xl font-bold mt-2">$0</p>
          </div>
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="text-sm font-medium text-muted-foreground">Active Sessions</h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
