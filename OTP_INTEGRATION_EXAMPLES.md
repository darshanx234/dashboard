# OTP System Integration Examples

## Integration with Signup Flow

### Option 1: Require Email Verification Before Access

Update your signup form to send OTP after user creation:

```typescript
// app/signup/page.tsx or components/auth/signup-form.tsx

const handleSignup = async (formData: SignupFormData) => {
  try {
    // 1. Create user account
    const signupResponse = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      }),
    });

    if (!signupResponse.ok) {
      const error = await signupResponse.json();
      setError(error.message);
      return;
    }

    // 2. Send OTP for email verification
    const otpResponse = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        purpose: 'signup', // or 'email-verification'
      }),
    });

    if (!otpResponse.ok) {
      setError('Account created but failed to send verification email');
      return;
    }

    const otpData = await otpResponse.json();

    // 3. Redirect to OTP verification page
    router.push(
      `/verify-otp?email=${encodeURIComponent(formData.email)}&purpose=signup&expiresAt=${otpData.expiresAt}&redirect=/dashboard`
    );

  } catch (error) {
    setError('An error occurred during signup');
  }
};
```

### Option 2: Allow Access, Prompt Verification Later

```typescript
// Create account and log in immediately, but mark as unverified
const handleSignup = async (formData: SignupFormData) => {
  // 1. Create account
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(formData),
  });

  // 2. Log user in (even if unverified)
  const { token } = await response.json();
  localStorage.setItem('token', token);

  // 3. Send verification email in background
  fetch('/api/otp/send', {
    method: 'POST',
    body: JSON.stringify({
      email: formData.email,
      purpose: 'email-verification',
    }),
  });

  // 4. Redirect to dashboard with verification banner
  router.push('/dashboard?verify=true');
};

// In dashboard, show banner prompting verification
if (searchParams.get('verify') === 'true' && !user.isVerified) {
  return (
    <Alert>
      <AlertCircle />
      <AlertDescription>
        Please verify your email to access all features.
        <Button onClick={() => router.push(`/verify-otp?email=${user.email}`)}>
          Verify Now
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

## Integration with Login Flow (2FA)

### Add Optional Two-Factor Authentication

```typescript
// app/login/page.tsx or components/auth/login-form.tsx

const handleLogin = async (email: string, password: string) => {
  try {
    // 1. Verify credentials
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!loginResponse.ok) {
      setError('Invalid credentials');
      return;
    }

    const { user, requires2FA } = await loginResponse.json();

    // 2. If 2FA enabled, send OTP
    if (requires2FA || user.twoFactorEnabled) {
      const otpResponse = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          purpose: 'login',
        }),
      });

      if (!otpResponse.ok) {
        setError('Failed to send verification code');
        return;
      }

      const otpData = await otpResponse.json();

      // Redirect to OTP verification
      router.push(
        `/verify-otp?email=${encodeURIComponent(email)}&purpose=login&expiresAt=${otpData.expiresAt}&redirect=/dashboard`
      );
      
    } else {
      // Normal login without 2FA
      const { token } = await loginResponse.json();
      localStorage.setItem('token', token);
      router.push('/dashboard');
    }

  } catch (error) {
    setError('Login failed');
  }
};
```

### Update Login API to Support 2FA Check

```typescript
// app/api/auth/login/route.ts

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.comparePassword(password))) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  // Check if user has 2FA enabled
  if (user.twoFactorEnabled) {
    return NextResponse.json({
      success: true,
      requires2FA: true,
      message: 'Verification code required',
    });
  }

  // Normal login flow
  const token = generateToken(user);
  return NextResponse.json({
    success: true,
    token,
    user: { /* user data */ },
  });
}
```

## Integration with Protected Routes

### Middleware to Check Email Verification

```typescript
// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const decoded = verifyToken(token);
    
    // Check if email is verified for certain routes
    const protectedRoutes = ['/upload', '/create-album', '/settings'];
    const currentPath = request.nextUrl.pathname;
    
    if (protectedRoutes.some(route => currentPath.startsWith(route))) {
      if (!decoded.isVerified) {
        return NextResponse.redirect(
          new URL(`/verify-otp?email=${decoded.email}&purpose=email-verification&redirect=${currentPath}`, request.url)
        );
      }
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/albums/:path*', '/upload', '/settings/:path*'],
};
```

## Integration with User Profile

### Add Verification Badge and Resend Option

```typescript
// app/profile/page.tsx or components/profile/email-verification.tsx

export function EmailVerificationSection({ user }: { user: User }) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendVerification = async () => {
    setSending(true);
    setMessage('');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          purpose: 'email-verification',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(
          `/verify-otp?email=${user.email}&purpose=email-verification&expiresAt=${data.expiresAt}&redirect=/profile`
        );
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to send verification email');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Verification</CardTitle>
        <CardDescription>Verify your email to access all features</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <div>
              <p className="font-medium">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                {user.isVerified ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Verified</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-600">Not Verified</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {!user.isVerified && (
            <Button
              onClick={handleSendVerification}
              disabled={sending}
              variant="outline"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Verify Email'
              )}
            </Button>
          )}
        </div>

        {message && (
          <Alert className="mt-4" variant={message.includes('Failed') ? 'destructive' : 'default'}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
```

## Integration with Settings (Enable 2FA)

### Add Two-Factor Authentication Toggle

```typescript
// app/settings/security/page.tsx

export default function SecuritySettingsPage() {
  const { user, updateUser } = useAuth();
  const [enabling2FA, setEnabling2FA] = useState(false);

  const handleToggle2FA = async (enabled: boolean) => {
    if (enabled) {
      // Enable 2FA - send verification OTP first
      setEnabling2FA(true);
      
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          purpose: 'email-verification',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // After verification, enable 2FA
        router.push(
          `/verify-otp?email=${user.email}&purpose=email-verification&expiresAt=${data.expiresAt}&redirect=/settings/security?enable2fa=true`
        );
      }
    } else {
      // Disable 2FA
      await fetch('/api/user/settings', {
        method: 'PATCH',
        body: JSON.stringify({ twoFactorEnabled: false }),
      });
      updateUser({ twoFactorEnabled: false });
    }
  };

  // Check if returning from verification to enable 2FA
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('enable2fa') === 'true' && user.isVerified) {
      // Enable 2FA after successful verification
      fetch('/api/user/settings', {
        method: 'PATCH',
        body: JSON.stringify({ twoFactorEnabled: true }),
      }).then(() => {
        updateUser({ twoFactorEnabled: true });
        router.replace('/settings/security');
      });
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Email-based 2FA</p>
            <p className="text-sm text-muted-foreground">
              Receive a code via email when you log in
            </p>
          </div>
          <Switch
            checked={user.twoFactorEnabled}
            onCheckedChange={handleToggle2FA}
            disabled={enabling2FA}
          />
        </div>
      </CardContent>
    </Card>
  );
}
```

## Automated Email Reminders

### Send Verification Reminders to Unverified Users

```typescript
// app/api/cron/send-verification-reminders/route.ts

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  // Verify cron secret (for security)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();

    // Find unverified users created more than 24 hours ago
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const unverifiedUsers = await User.find({
      isVerified: false,
      createdAt: { $lt: oneDayAgo },
      // Don't spam - check last reminder sent
      lastReminderSent: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }).limit(100);

    let sent = 0;
    for (const user of unverifiedUsers) {
      // Send OTP
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          purpose: 'email-verification',
        }),
      });

      if (response.ok) {
        // Update last reminder sent
        await User.updateOne(
          { _id: user._id },
          { $set: { lastReminderSent: new Date() } }
        );
        sent++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sent} verification reminders`,
    });

  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

Set up cron job (Vercel Cron, AWS EventBridge, etc.):
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/send-verification-reminders",
    "schedule": "0 9 * * *"
  }]
}
```

## Quick Start Checklist

For immediate use in your app:

1. ✅ **Forgot Password Link** - Add to login page:
   ```tsx
   <Link href="/auth/forgot-password">Forgot Password?</Link>
   ```

2. ✅ **Signup Integration** - Redirect to OTP after signup:
   ```tsx
   router.push(`/verify-otp?email=${email}&purpose=signup`);
   ```

3. ✅ **Profile Verification** - Add verification badge in profile

4. ✅ **Protected Routes** - Add middleware check for verification

5. 🔄 **Email Service** - Configure production email service in `lib/email.ts`

6. 🔄 **Environment Variables** - Add email service credentials

---

**Ready to Use:** All OTP endpoints and pages are functional!  
**Next:** Connect your email service and integrate with your auth flow.
