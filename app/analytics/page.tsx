import { AppLayout } from '@/components/layout/app-layout';

export default function AnalyticsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track views, downloads, and favorites for your albums
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="text-sm font-medium text-muted-foreground">Total Views</h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="text-sm font-medium text-muted-foreground">Downloads</h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="text-sm font-medium text-muted-foreground">Favorites</h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
