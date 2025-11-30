import { AppLayout } from '@/components/layout/app-layout';
import { ProfileForm } from '@/components/auth/profile-form';

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className="space-y-6 d-flex justify-center">
        {/* <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and personal information
          </p>
        </div> */}

        <ProfileForm />
      </div>
    </AppLayout>
  );
}
