# Code Changes Summary

## File 1: app/api/auth/signup/route.ts

### What Changed
- Added OTP imports
- Added email validation
- Create user with `isVerified: false`
- Generate and send OTP
- Return OTP expiry in response

### Key Addition - OTP Generation & Sending
```typescript
// Generate OTP for email verification
const otpCode = generateOTP();
const OTP_EXPIRY_MINUTES = 10;
const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

// Save OTP to database
await OTP.create({
  email: email.toLowerCase(),
  otp: otpCode,
  purpose: 'signup',
  verified: false,
  attempts: 0,
  expiresAt,
});

// Send OTP via email
const emailSent = await sendOTPEmail(email.toLowerCase(), otpCode, 'signup');
```

### Key Addition - Response Update
```typescript
// Return OTP expiry time to frontend
const response = NextResponse.json(
  {
    message: 'User created successfully. Please verify your email.',
    requiresVerification: true,
    user: { /* ... */ },
    token,
    otpExpiresAt: expiresAt.toISOString(),  // ← New field
  },
  { status: 201 }
);
```

---

## File 2: components/auth/signup-form.tsx

### What Changed
- Removed `getDefaultHomePage` import
- Direct API call instead of auth store
- Redirect to `/verify-otp` page
- Use OTP expiry from API response

### Key Change - Signup Handler
```typescript
// Before
await signup(email, password);
setSuccess(true);
setTimeout(() => {
  const user = useAuthStore.getState().user;
  const homePage = getDefaultHomePage(user?.role || 'photographer');
  router.push(homePage);
}, 2000);

// After
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
  credentials: 'include',
});

const data = await response.json();

useAuthStore.setState({
  user: data.user,
  token: data.token,
});

setSuccess(true);

setTimeout(() => {
  const params = new URLSearchParams({
    email: email,
    purpose: 'signup',
    redirect: '/dashboard',
  });

  if (data.otpExpiresAt) {
    params.append('expiresAt', data.otpExpiresAt);
  }

  router.push(`/verify-otp?${params.toString()}`);
}, 1500);
```

---

## Detailed Before/After

### Signup API Before
```typescript
// Create new user
const user = await User.create({
  email: email.toLowerCase(),
  password,
});

// Generate token
const token = generateToken({ ... });

// Return response
return NextResponse.json({
  message: 'User created successfully',
  user: { /* ... */ },
  token,
}, { status: 201 });
```

### Signup API After
```typescript
// Validate email format (NEW)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
}

// Create user with isVerified: false (CHANGED)
const user = await User.create({
  email: email.toLowerCase(),
  password,
  isVerified: false,  // ← NEW
});

// Generate OTP (NEW)
const otpCode = generateOTP();
const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

// Save OTP (NEW)
await OTP.create({
  email: email.toLowerCase(),
  otp: otpCode,
  purpose: 'signup',
  verified: false,
  attempts: 0,
  expiresAt,
});

// Send OTP (NEW)
const emailSent = await sendOTPEmail(email.toLowerCase(), otpCode, 'signup');

// Generate token
const token = generateToken({ ... });

// Return response with OTP expiry (CHANGED)
return NextResponse.json({
  message: 'User created successfully. Please verify your email.',
  requiresVerification: true,  // ← NEW
  user: { /* ... */ },
  token,
  otpExpiresAt: expiresAt.toISOString(),  // ← NEW
}, { status: 201 });
```

---

## Signup Form Before
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setSuccess(false);
  setLoading(true);

  if (password !== confirmPassword) {
    setError('Passwords do not match');
    setLoading(false);
    return;
  }

  if (password.length < 6) {
    setError('Password must be at least 6 characters');
    setLoading(false);
    return;
  }

  try {
    await signup(email, password);  // ← Uses auth store
    setSuccess(true);
    setTimeout(() => {
      const user = useAuthStore.getState().user;
      const homePage = getDefaultHomePage(user?.role || 'photographer');
      router.push(homePage);  // ← Redirect to dashboard
    }, 2000);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to sign up');
  } finally {
    setLoading(false);
  }
};
```

## Signup Form After
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setSuccess(false);
  setLoading(true);

  if (password !== confirmPassword) {
    setError('Passwords do not match');
    setLoading(false);
    return;
  }

  if (password.length < 6) {
    setError('Password must be at least 6 characters');
    setLoading(false);
    return;
  }

  try {
    // Direct API call (NEW)
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sign up');
    }

    const data = await response.json();

    // Store in auth store (NEW)
    useAuthStore.setState({
      user: data.user,
      token: data.token,
    });

    setSuccess(true);

    // Redirect to OTP page (CHANGED)
    setTimeout(() => {
      const params = new URLSearchParams({
        email: email,
        purpose: 'signup',
        redirect: '/dashboard',
      });

      if (data.otpExpiresAt) {
        params.append('expiresAt', data.otpExpiresAt);
      }

      router.push(`/verify-otp?${params.toString()}`);
    }, 1500);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to sign up');
  } finally {
    setLoading(false);
  }
};
```

---

## Import Changes

### Signup API - Added Imports
```typescript
// NEW IMPORTS
import OTP from '@/lib/models/OTP';
import { generateOTP, sendOTPEmail } from '@/lib/email';
```

### Signup Form - Removed Imports
```typescript
// REMOVED
import { getDefaultHomePage } from '@/lib/role-access';

// KEPT (Used for everything else)
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { Button, Input, Label, Card, etc. } from '@/components/ui';
```

---

## Database Impact

### User Collection - Change
```javascript
// Before
{
  _id: ObjectId,
  email: "user@example.com",
  password: "hashed",
  role: "photographer",
  isVerified: undefined  // ← Not set
}

// After
{
  _id: ObjectId,
  email: "user@example.com",
  password: "hashed",
  role: "photographer",
  isVerified: false  // ← Explicitly false
}
```

### OTP Collection - New Record
```javascript
// Created automatically after signup
{
  _id: ObjectId,
  email: "user@example.com",
  otp: "123456",
  purpose: "signup",
  verified: false,
  attempts: 0,
  expiresAt: ISODate("2024-01-15T10:30:00.000Z"),
  createdAt: ISODate("2024-01-15T10:20:00.000Z"),
  updatedAt: ISODate("2024-01-15T10:20:00.000Z")
}
```

---

## API Response Change

### Before Signup
```json
POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "password123"
}

RESPONSE (201)
{
  "message": "User created successfully",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "role": "photographer",
    "isVerified": false
  },
  "token": "eyJhbGc..."
}
```

### After Signup (Now)
```json
POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "password123"
}

RESPONSE (201)
{
  "message": "User created successfully. Please verify your email.",
  "requiresVerification": true,
  "user": {
    "id": "123",
    "email": "user@example.com",
    "role": "photographer",
    "isVerified": false
  },
  "token": "eyJhbGc...",
  "otpExpiresAt": "2024-01-15T10:30:00.000Z"
}
```

---

## Request/Response Flow

### Complete Request/Response Sequence

#### 1. Signup Form Submission
```javascript
Request:
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 2. Signup API Response
```javascript
Response: 201 Created
Content-Type: application/json
Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict

{
  "message": "User created successfully. Please verify your email.",
  "requiresVerification": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": null,
    "lastName": null,
    "phone": "",
    "bio": "",
    "avatar": null,
    "role": "photographer",
    "isVerified": false,
    "createdAt": "2024-01-15T10:20:00.000Z",
    "updatedAt": "2024-01-15T10:20:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "otpExpiresAt": "2024-01-15T10:30:00.000Z"
}
```

#### 3. Frontend Processes Response
```javascript
// Store in Zustand
useAuthStore.setState({
  user: data.user,
  token: data.token,
});

// Show success for 1.5 seconds
// Then redirect to OTP page
window.location.href = '/verify-otp?email=user@example.com&purpose=signup&expiresAt=2024-01-15T10:30:00.000Z&redirect=/dashboard'
```

#### 4. OTP Verification Flow
```javascript
Request:
POST /api/otp/verify
{
  "email": "user@example.com",
  "otp": "123456",
  "purpose": "signup"
}

Response: 200 OK
{
  "success": true,
  "message": "OTP verified successfully",
  "email": "user@example.com",
  "purpose": "signup"
}

// User record now has isVerified: true
// Redirect to /dashboard
```

---

## Key Differences Summary

| Aspect | Before | After |
|--------|--------|-------|
| Signup Creates | User account | User account + OTP |
| User isVerified | Undefined/not set | Explicitly false |
| After Signup | Direct to dashboard | OTP verification page |
| Email validation | None | Regex check |
| OTP Sending | Not done | Automatic |
| Response Fields | user, token | user, token, otpExpiresAt |
| requiresVerification | Not sent | true |

---

## Git Diff Summary

### File: app/api/auth/signup/route.ts
```
+ import OTP from '@/lib/models/OTP';
+ import { generateOTP, sendOTPEmail } from '@/lib/email';

+ // Email validation
+ const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
+ if (!emailRegex.test(email)) { ... }

- const user = await User.create({ email, password });
+ const user = await User.create({ 
+   email, 
+   password, 
+   isVerified: false 
+ });

+ // OTP generation and sending
+ const otpCode = generateOTP();
+ const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
+ await OTP.create({ email, otp: otpCode, purpose: 'signup', ... });
+ await sendOTPEmail(email, otpCode, 'signup');

- message: 'User created successfully'
+ message: 'User created successfully. Please verify your email.'
+ requiresVerification: true
+ otpExpiresAt: expiresAt.toISOString()
```

### File: components/auth/signup-form.tsx
```
- import { getDefaultHomePage } from '@/lib/role-access';

- await signup(email, password);
+ const response = await fetch('/api/auth/signup', { ... });
+ const data = await response.json();
+ useAuthStore.setState({ user: data.user, token: data.token });

- const homePage = getDefaultHomePage(user?.role || 'photographer');
- router.push(homePage);
+ const params = new URLSearchParams({
+   email, purpose: 'signup', redirect: '/dashboard', ...
+ });
+ router.push(`/verify-otp?${params.toString()}`);

- }, 2000);
+ }, 1500);
```

---

## Testing Checklist

- [ ] Signup form still renders
- [ ] Email validation works
- [ ] Duplicate email rejected
- [ ] Short password rejected
- [ ] Passwords don't match validation
- [ ] Success message appears
- [ ] Redirects to /verify-otp
- [ ] OTP code in terminal
- [ ] User created in database
- [ ] OTP created in database
- [ ] isVerified is false
- [ ] otpExpiresAt included in response

---

## No Breaking Changes

✅ Existing login flow unaffected
✅ Existing dashboard code unaffected
✅ Existing OTP endpoints unaffected
✅ JWT tokens work same way
✅ Auth middleware unaffected
✅ All other APIs unaffected

---

**Summary:** Two focused changes to enable OTP verification after signup!
