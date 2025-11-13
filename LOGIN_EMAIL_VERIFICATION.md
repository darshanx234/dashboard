# Login with Email Verification Check

## Overview
The login flow has been updated to check if a user's email is verified. If the user hasn't verified their email after signup, they will be redirected to the OTP verification page before accessing the dashboard.

---

## New Login Flow

```
User enters email & password
           ↓
Click "Sign In"
           ↓
POST /api/auth/login
           ↓
┌─ Password Check ─┐
├─ Not Found ──→ Error: Invalid credentials
├─ Wrong Password → Error: Invalid credentials
└─ Password OK ↓
           ↓
Check isVerified
           ↓
┌─ isVerified: false ─┐
│ Generate OTP        │
│ Save to DB          │
│ Send via email      │
│ Return status 403   │
└─────→ Redirect to /verify-otp
           ↓
┌─ isVerified: true ──┐
│ Generate JWT token  │
│ Set cookie          │
│ Return user data    │
└─────→ Redirect to dashboard
```

---

## API Changes

### Login Endpoint
**Route:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response - Already Verified User (200 OK)
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "photographer",
    "isVerified": true,
    ...
  },
  "token": "jwt_token"
}
```

### Response - Unverified User (403 Forbidden)
```json
{
  "message": "Please verify your email to complete login",
  "requiresVerification": true,
  "email": "user@example.com",
  "otpExpiresAt": "2024-01-15T10:30:00.000Z"
}
```

### Error Responses
```json
// Wrong password or email not found
{
  "error": "Invalid email or password"
}

// Server error
{
  "error": "Internal server error"
}
```

---

## Login Form Changes

### What Changed
- Removed direct auth store login call
- Added API call to `/api/auth/login`
- Check for `requiresVerification` flag
- Redirect to `/verify-otp` if email not verified
- Continue to dashboard if email is verified

### Code Flow
```typescript
1. handleSubmit() called
2. POST /api/auth/login
3. Check response status
   - 403 + requiresVerification → Redirect to /verify-otp
   - 200 → Store user + token, redirect to dashboard
   - Other error → Show error message
```

---

## User Experience

### Scenario 1: User Verified Email (Normal Login)
1. User goes to login page
2. Enters email and password
3. Clicks "Sign In"
4. ✅ Logged in successfully
5. Redirected to dashboard

### Scenario 2: User Hasn't Verified Email
1. User signs up but skips OTP verification
2. User tries to login later
3. Enters email and password
4. Clicks "Sign In"
5. ⚠️ Gets message: "Please verify your email to complete login"
6. OTP email sent automatically
7. Redirected to `/verify-otp` page
8. Enters OTP code
9. ✅ Email verified
10. Redirected to dashboard

### Scenario 3: Invalid Credentials
1. User enters wrong email or password
2. ❌ Gets error: "Invalid email or password"
3. Can retry or use "Forgot Password"

---

## Database Updates

### User Record
```javascript
{
  email: "user@example.com",
  password: "hashed_password",
  isVerified: false,  // ← Login checks this
  role: "photographer",
  createdAt: Date,
  updatedAt: Date
}
```

### OTP Created (If Not Verified)
```javascript
{
  email: "user@example.com",
  otp: "123456",
  purpose: "email-verification",  // ← Changed from "signup"
  verified: false,
  attempts: 0,
  expiresAt: Date,  // 10 minutes
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Behavior Details

### Step-by-Step API Logic

#### 1. User Authentication
```typescript
// Find user and verify password
const user = await User.findOne({ email })
  .select('+password');

if (!user || !(await user.comparePassword(password))) {
  return error('Invalid email or password');
}
```

#### 2. Email Verification Check
```typescript
// Check if email is verified
if (!user.isVerified) {
  // Generate new OTP
  const otpCode = generateOTP();
  
  // Save to database
  await OTP.create({
    email,
    otp: otpCode,
    purpose: 'email-verification',
    ...
  });
  
  // Send email
  await sendOTPEmail(email, otpCode, 'email-verification');
  
  // Return 403 Forbidden with verification required flag
  return response({
    message: 'Please verify your email to complete login',
    requiresVerification: true,
    email,
    otpExpiresAt
  }, 403);
}
```

#### 3. Successful Login
```typescript
// User is verified, create JWT token
const token = generateToken({
  userId: user._id,
  email: user.email,
  role: user.role
});

// Return token and user data
return response({
  message: 'Login successful',
  user,
  token
}, 200);
```

---

## Frontend Handling

### Login Form Logic
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

const data = await response.json();

// Check if verification is required
if (!response.ok && response.status === 403 && data.requiresVerification) {
  // Redirect to OTP verification
  router.push(`/verify-otp?email=${email}&purpose=email-verification&redirect=/dashboard`);
  return;
}

if (!response.ok) {
  // Show error
  setError(data.error);
  return;
}

// Login successful
useAuthStore.setState({
  user: data.user,
  token: data.token
});

router.push('/dashboard');
```

---

## Security Considerations

✅ **Prevents Unauthorized Access**
- Unverified users cannot access dashboard
- Must verify email first

✅ **Prevents Email Misuse**
- Only legitimate users can access accounts
- Email verification proves email ownership

✅ **Rate Limiting**
- Max 3 OTP sends per hour per email
- Login attempts tracked by password check

✅ **Token Security**
- JWT tokens only issued to verified users
- HTTPOnly cookies prevent JavaScript access
- 7-day expiry

---

## Files Modified

| File | Changes |
|------|---------|
| `app/api/auth/login/route.ts` | Added email verification check + OTP generation |
| `components/auth/login-form.tsx` | Check verification status + redirect to OTP |

## Files Referenced

- `lib/models/OTP.ts` - OTP model for storing codes
- `lib/email.ts` - Email sending service
- `app/verify-otp/page.tsx` - OTP verification page
- `app/api/otp/verify/route.ts` - OTP verification endpoint

---

## Testing Guide

### Test Case 1: Verified User Login
1. Sign up and complete OTP verification
2. Try to login with same email
3. ✅ Should login successfully
4. Redirected to dashboard

### Test Case 2: Unverified User Login
1. Sign up but DON'T verify email
2. Try to login
3. ⚠️ Should see: "Please verify your email to complete login"
4. Check terminal/email for OTP
5. Enter OTP on verification page
6. ✅ Email verified
7. Redirected to dashboard

### Test Case 3: Wrong Password
1. Try to login with correct email but wrong password
2. ❌ Should see: "Invalid email or password"
3. Cannot proceed

### Test Case 4: Email Doesn't Exist
1. Try to login with non-existent email
2. ❌ Should see: "Invalid email or password"
3. Cannot proceed

### Test Case 5: OTP Expiry
1. Unverified user logs in (gets OTP)
2. Wait 10+ minutes
3. Try to enter OTP
4. ❌ Should see: "OTP not found or expired"
5. Use "Resend Code" to get new OTP

---

## URL Parameters

When redirecting to OTP verification, these parameters are passed:

```
/verify-otp?
  email=user@example.com
  &purpose=email-verification
  &expiresAt=2024-01-15T10:30:00.000Z
  &redirect=/dashboard
```

- **email** - User's email
- **purpose** - Set to "email-verification"
- **expiresAt** - When OTP expires
- **redirect** - Where to go after verification

---

## Status Codes

| Code | Meaning | Next Action |
|------|---------|-------------|
| 200 | Login successful + verified | Go to dashboard |
| 403 | Password correct but not verified | Go to OTP page |
| 401 | Invalid credentials | Show error, retry |
| 500 | Server error | Show error, retry |

---

## Edge Cases Handled

✅ **User signs up but never verifies**
- Can still login
- Forced to verify before accessing dashboard

✅ **User verifies, then tries again**
- Login goes directly to dashboard
- No OTP needed

✅ **OTP expires during login verification**
- User sees "OTP expired"
- Can use "Resend Code" button
- New OTP sent

✅ **Multiple login attempts**
- Wrong password → Error message
- Can retry with correct password
- After verification required → Goes to OTP page

---

## Flow Diagram

```
┌─────────────────────────────────────┐
│   Login Form                        │
│   (email + password)                │
└──────────────┬──────────────────────┘
               │
               │ POST /api/auth/login
               v
┌─────────────────────────────────────┐
│   Login API                         │
│   - Verify password                 │
│   - Check isVerified field          │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        ↓             ↓
   NOT VERIFIED   VERIFIED
        │             │
        ↓             ↓
   ┌────────────┐  ┌──────────────┐
   │ Generate   │  │ Generate JWT │
   │ OTP        │  │ Set cookie   │
   │ Send email │  │ Return token │
   │ Return 403 │  │ Return 200   │
   └────────────┘  └──────────────┘
        │             │
        ↓             ↓
   ┌─────────────┐  ┌──────────┐
   │ /verify-otp │  │/dashboard│
   │ Enter OTP   │  │ Logged in│
   └─────────────┘  └──────────┘
        │
        │ OTP verified
        v
   ┌──────────────┐
   │ /dashboard   │
   │ Logged in    │
   └──────────────┘
```

---

## Example Complete Flow

### User Journey: Unverified User Logs In

1. **Signup** (Previous)
   - Create account with email "john@example.com"
   - Receive OTP email
   - **Skip OTP verification** (or close tab)

2. **Hours later: Try to Login**
   - Visit login page
   - Enter: john@example.com / password123
   - Click "Sign In"

3. **Backend Check**
   - API finds user with matching credentials
   - Checks `isVerified` field → false
   - Generates new OTP: "456789"
   - Saves OTP to database (expires in 10 min)
   - Sends email with code
   - Returns 403 status

4. **Frontend Redirect**
   - Login form sees 403 + requiresVerification
   - Redirects to: `/verify-otp?email=john@example.com&purpose=email-verification&expiresAt=...&redirect=/dashboard`

5. **Verification Page**
   - User sees: "Verify Your Email"
   - Code sent to: john@example.com
   - Countdown timer: 10:00

6. **User Gets Email**
   - Opens email
   - Sees OTP code: 456789
   - Copies code to verification page

7. **Verify OTP**
   - User enters: 4 5 6 7 8 9
   - Form auto-submits
   - API verifies code
   - Updates user: `isVerified = true`
   - Marks OTP as verified

8. **Success**
   - Page shows: "Verification successful!"
   - Redirects to: /dashboard
   - User fully logged in ✓

---

## Summary

✅ **Email Verification on Login**
- Unverified users cannot access dashboard
- OTP sent automatically during login
- User must verify email before proceeding

✅ **Better Security**
- Prevents account takeover
- Proves email ownership
- User must have email access

✅ **Seamless Experience**
- Automatic OTP generation on login
- Clear messaging about what to do
- Can resend OTP anytime

✅ **No Breaking Changes**
- Verified users experience no difference
- Unverified users get redirected to OTP
- All existing functionality preserved

---

**Status:** ✅ Implemented and Tested
**Files Modified:** 2
**User Impact:** Better security with mandatory email verification
