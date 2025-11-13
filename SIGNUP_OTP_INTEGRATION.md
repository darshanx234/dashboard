# Signup OTP Integration Guide

## Overview
The signup flow has been updated to automatically send an OTP (One-Time Password) to the user's email after account creation. Users must verify their email before accessing the full dashboard.

## Flow Diagram

```
User enters email & password
           ↓
User clicks "Create Account"
           ↓
Signup API creates user account
           ↓
Signup API generates OTP & sends via email
           ↓
Signup API returns OTP expiry time
           ↓
Signup form shows success message
           ↓
Signup form redirects to /verify-otp page
           ↓
User enters OTP code
           ↓
OTP verification marks user as verified
           ↓
User redirected to /dashboard
```

## Changes Made

### 1. Updated Signup API (`app/api/auth/signup/route.ts`)

**New Features:**
- Validates email format
- Creates user with `isVerified: false` by default
- Generates 6-digit OTP code
- Saves OTP to database with 10-minute expiry
- Sends OTP email using `sendOTPEmail()`
- Returns OTP expiry time to frontend
- Sets `requiresVerification: true` flag

**Response Structure:**
```json
{
  "message": "User created successfully. Please verify your email.",
  "requiresVerification": true,
  "user": { /* user object */ },
  "token": "jwt_token",
  "otpExpiresAt": "2024-01-15T10:30:00.000Z"
}
```

### 2. Updated Signup Form (`components/auth/signup-form.tsx`)

**New Behavior:**
- Calls `/api/auth/signup` directly instead of using auth store's `signup()` method
- Receives OTP expiry time from API response
- Shows success message for 1.5 seconds
- Redirects to `/verify-otp` with query parameters:
  - `email` - User's email
  - `purpose` - Set to "signup"
  - `expiresAt` - OTP expiry timestamp (ISO format)
  - `redirect` - Where to go after verification (/dashboard)

**Redirect URL Example:**
```
/verify-otp?email=user@example.com&purpose=signup&expiresAt=2024-01-15T10:30:00.000Z&redirect=/dashboard
```

## How It Works

### Step 1: User Signup
User fills out email and password, clicks "Create Account"

### Step 2: Account Creation & OTP Generation
```typescript
// Signup API creates:
1. New user with isVerified = false
2. OTP code (6 digits)
3. OTP record in database (expires in 10 minutes)
4. Sends email with OTP code
```

### Step 3: Verification Prompt
User sees "Account Created!" message, then redirected to OTP verification page

### Step 4: OTP Verification
User enters 6-digit OTP code from email
- Valid OTP → User marked as verified → Redirected to dashboard
- Invalid OTP → Shows error, can resend
- Expired OTP → Can request new code via /api/otp/resend

### Step 5: Dashboard Access
Verified users can now access the full dashboard

## Key Features

✅ **Automatic Email Verification**
- OTP sent immediately after signup
- No manual verification process

✅ **Beautiful OTP Input Page**
- 6-digit input with auto-focus
- Auto-submit when complete
- Paste support for OTP codes
- Countdown timer showing expiry time
- Resend button with cooldown

✅ **Rate Limiting**
- Max 3 OTPs per hour per email
- 60-second cooldown between resends
- Max 5 verification attempts

✅ **Error Handling**
- Shows clear error messages
- Displays remaining attempts
- Lets users resend OTP
- Handles network errors gracefully

✅ **User Experience**
- Smooth success transitions
- Clear next steps
- Can resend OTP anytime
- Redirects to appropriate page after verification

## Technical Details

### OTP Model Fields
```typescript
{
  email: string,           // User's email
  otp: string,            // 6-digit code
  purpose: "signup",      // Fixed for signup
  verified: boolean,      // false initially, true after verification
  attempts: number,       // Increment on each failed attempt
  expiresAt: Date,       // Auto-expires in 10 minutes
  createdAt: Date,
  updatedAt: Date
}
```

### User Model Update
```typescript
{
  isVerified: boolean     // Set to true after OTP verification
  // ... other fields
}
```

## Database Operations

### 1. User Creation
```typescript
await User.create({
  email: email.toLowerCase(),
  password: hashedPassword,
  isVerified: false,  // Initially unverified
  role: 'photographer', // Default role
});
```

### 2. OTP Creation
```typescript
await OTP.create({
  email: email.toLowerCase(),
  otp: '123456',
  purpose: 'signup',
  verified: false,
  attempts: 0,
  expiresAt: new Date(Date.now() + 10 * 60 * 1000),
});
```

### 3. User Verification
```typescript
// When OTP is verified in /api/otp/verify
await User.updateOne(
  { email },
  { $set: { isVerified: true } }
);
```

## API Endpoints Used

### Signup Endpoint
- **Route:** `POST /api/auth/signup`
- **Body:** `{ email, password }`
- **Response:** User, token, OTP expiry time

### Send OTP Endpoint
- **Route:** `POST /api/otp/send`
- **Used by:** Signup API (automatic)
- **Also available for:** Resend OTP on verification page

### Verify OTP Endpoint
- **Route:** `POST /api/otp/verify`
- **Body:** `{ email, otp, purpose: "signup" }`
- **Response:** Marks user as verified

### Resend OTP Endpoint
- **Route:** `POST /api/otp/resend`
- **Body:** `{ email, purpose: "signup" }`
- **Used by:** Verification page

## Frontend Components

### Signup Form (`components/auth/signup-form.tsx`)
- Email input
- Password input
- Confirm password input
- Error alerts
- Loading state
- Success message
- Redirects to OTP verification

### OTP Verification Page (`app/verify-otp/page.tsx`)
- 6-digit OTP input
- Countdown timer
- Resend button with cooldown
- Error handling
- Auto-submit on complete
- Paste support

## Testing

### Development Testing

1. **Start Application**
   ```bash
   npm run dev
   ```

2. **Sign Up**
   - Go to http://localhost:3000/signup
   - Enter email and password
   - Click "Create Account"

3. **Check OTP**
   - Look at terminal/console for OTP code
   - Output format:
     ```
     ============================================================
     📧 EMAIL SENT:
     To: user@example.com
     Subject: Complete Your Registration - Verification Code
     Content: Your verification code is: 123456
     ============================================================
     ```

4. **Verify Email**
   - Automatically redirected to `/verify-otp`
   - Enter the OTP code from terminal
   - Should auto-submit and verify
   - Redirected to dashboard

### Test Cases

- ✅ Valid signup with OTP verification
- ✅ Invalid OTP (too many attempts)
- ✅ Expired OTP (after 10 minutes)
- ✅ Resend OTP (with 60-second cooldown)
- ✅ Paste OTP code
- ✅ Network error handling
- ✅ Duplicate email rejection

## Production Checklist

- [ ] Configure email service (SendGrid, AWS SES, etc.)
- [ ] Set environment variables for email
- [ ] Test with real email addresses
- [ ] Verify OTP emails are being sent
- [ ] Test complete signup → verification → dashboard flow
- [ ] Monitor OTP delivery rates
- [ ] Set up email bounce/complaint handling
- [ ] Test rate limiting (3 OTPs per hour)
- [ ] Verify TTL index removes expired OTPs
- [ ] Set up logging/monitoring for failed verifications

## Configuration

### Email Service Setup
Update `lib/email.ts` to use production email service:

```typescript
// Example: SendGrid
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(options: EmailOptions) {
  await sgMail.send({
    to: options.to,
    from: process.env.FROM_EMAIL!,
    subject: options.subject,
    html: options.html,
  });
}
```

### Environment Variables
Add to `.env.local`:
```env
# Email Service
SENDGRID_API_KEY=your_key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your App Name
```

## Security Considerations

1. **OTP Security**
   - 6-digit codes with 900,000 possible combinations
   - 10-minute expiry (automatic cleanup via TTL)
   - Max 5 verification attempts
   - Rate limited to 3 per hour

2. **User Security**
   - Password hashed before storage
   - Email verified before full access
   - JWT tokens with 7-day expiry
   - HTTPOnly cookies for tokens

3. **Email Security**
   - Validates email format
   - Lowercases for consistency
   - Duplicate email prevention

## Future Enhancements

- [ ] SMS OTP as alternative to email
- [ ] Skip verification option for admin users
- [ ] Custom branding for OTP emails
- [ ] Webhook for email delivery tracking
- [ ] Resend OTP from dashboard if not verified
- [ ] Temporary access before verification (optional)
- [ ] Email notification preferences

## Files Modified

1. `app/api/auth/signup/route.ts` - Added OTP generation & sending
2. `components/auth/signup-form.tsx` - Redirects to OTP verification

## Files Referenced (Created Earlier)

1. `lib/models/OTP.ts` - OTP database model
2. `lib/email.ts` - Email utility & templates
3. `app/api/otp/send/route.ts` - Send OTP endpoint
4. `app/api/otp/verify/route.ts` - Verify OTP endpoint
5. `app/api/otp/resend/route.ts` - Resend OTP endpoint
6. `app/verify-otp/page.tsx` - OTP verification page

## Example Requests

### Signup Request
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }'
```

### Signup Response
```json
{
  "message": "User created successfully. Please verify your email.",
  "requiresVerification": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "photographer",
    "isVerified": false
  },
  "token": "jwt_token",
  "otpExpiresAt": "2024-01-15T10:30:00.000Z"
}
```

---

**Status:** ✅ Fully Integrated  
**Next Step:** Configure your email service and test the complete flow!
