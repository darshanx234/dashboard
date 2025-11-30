import { AppLayout } from '@/components/layout/app-layout';

export default function AdminReportsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-2">
            Billing and usage statistics
          </p>
        </div>

        <div className="grid gap-4">
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-lg font-semibold mb-2">System Reports</h2>
            <p className="text-sm text-muted-foreground">
              Billing and usage reports will appear here
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
