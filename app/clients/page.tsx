import { AppLayout } from '@/components/layout/app-layout';

export default function ClientsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-2">
            Manage your clients and their linked albums
          </p>
        </div>

        <div className="grid gap-4">
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-lg font-semibold mb-2">Client List</h2>
            <p className="text-sm text-muted-foreground">
              Your client management features will appear here
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
