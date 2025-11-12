import { AppLayout } from '@/components/layout/app-layout';

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your profile, password, billing, and API settings
          </p>
        </div>

        <div className="grid gap-4">
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-lg font-semibold mb-2">Account Settings</h2>
            <p className="text-sm text-muted-foreground">
              Your settings will appear here
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
