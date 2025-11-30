import { AppLayout } from '@/components/layout/app-layout';

export default function AdminAlbumsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Album Management</h1>
          <p className="text-muted-foreground mt-2">
            Overview of all albums across the platform
          </p>
        </div>

        <div className="grid gap-4">
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-lg font-semibold mb-2">All Albums</h2>
            <p className="text-sm text-muted-foreground">
              Platform-wide album overview will appear here
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
