# OTP Verification System Documentation

## Overview
Complete OTP (One-Time Password) verification system with email delivery, resend functionality, rate limiting, and multiple use cases (signup, login, password reset, email verification).

## Features
✅ 6-digit OTP generation  
✅ Email delivery (template included, ready for production email service)  
✅ 10-minute expiry with automatic cleanup (MongoDB TTL index)  
✅ Resend functionality with 60-second cooldown  
✅ Rate limiting (max 3 OTPs per hour per email)  
✅ Attempt limiting (max 5 verification attempts)  
✅ Multiple purposes: signup, login, password-reset, email-verification  
✅ Beautiful UI with countdown timers  
✅ Auto-focus and auto-submit OTP inputs  
✅ Password strength indicator on reset page  
✅ Complete password reset flow  

## Architecture

### Database Model
**File:** `lib/models/OTP.ts`

```typescript
{
  email: string,           // User's email
  otp: string,            // 6-digit code
  purpose: enum,          // signup | login | password-reset | email-verification
  verified: boolean,      // Has been verified
  attempts: number,       // Verification attempts (max 5)
  expiresAt: Date,       // Auto-expires in 10 minutes
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- TTL index on `expiresAt` for automatic document deletion
- Compound index: `email + purpose + verified`
- Index on `expiresAt` for efficient queries

### API Endpoints

#### 1. Send OTP
**Endpoint:** `POST /api/otp/send`

**Request:**
```json
{
  "email": "user@example.com",
  "purpose": "password-reset" // optional, defaults to "email-verification"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 600,
  "expiresAt": "2024-01-15T10:30:00.000Z"
}
```

**Features:**
- Validates email format
- Checks user exists (for login/password-reset)
- Rate limiting: max 3 OTPs per hour
- Invalidates previous OTPs
- Sends email with 6-digit code

#### 2. Verify OTP
**Endpoint:** `POST /api/otp/verify`

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "purpose": "password-reset"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "email": "user@example.com",
  "purpose": "password-reset",
  "resetToken": "base64token..." // Only for password-reset
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid OTP. 3 attempt(s) remaining.",
  "code": "INVALID_OTP",
  "remainingAttempts": 3
}
```

**Features:**
- Max 5 verification attempts
- Shows remaining attempts on failure
- Marks user as verified (for email-verification/signup)
- Returns reset token for password reset (15-minute validity)

#### 3. Resend OTP
**Endpoint:** `POST /api/otp/resend`

**Request:**
```json
{
  "email": "user@example.com",
  "purpose": "password-reset"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP resent successfully",
  "expiresIn": 600,
  "expiresAt": "2024-01-15T10:40:00.000Z",
  "cooldown": 60
}
```

**Features:**
- 60-second cooldown between resends
- Rate limiting: max 3 OTPs per hour
- Invalidates previous OTPs
- Generates new 6-digit code

#### 4. Reset Password
**Endpoint:** `POST /api/auth/reset-password`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "newpassword123",
  "resetToken": "base64token..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Features:**
- Validates reset token
- Checks token expiry (15 minutes)
- Requires password min 8 characters
- Hashes password with bcrypt

## Frontend Pages

### 1. Verify OTP Page
**Route:** `/verify-otp`

**Query Parameters:**
- `email` - User's email (required)
- `purpose` - OTP purpose (default: email-verification)
- `expiresAt` - Expiry timestamp (ISO format)
- `redirect` - Redirect URL after success (default: /)

**Example URL:**
```
/verify-otp?email=user@example.com&purpose=password-reset&expiresAt=2024-01-15T10:30:00.000Z&redirect=/dashboard
```

**Features:**
- 6 input fields for OTP digits
- Auto-focus next field on input
- Auto-submit when complete
- Paste support (paste 6-digit code)
- Countdown timer showing time remaining
- Resend button with 60-second cooldown
- Shows remaining verification attempts
- Auto-redirect on success

### 2. Forgot Password Page
**Route:** `/auth/forgot-password`

**Features:**
- Email input with validation
- Sends OTP via `/api/otp/send`
- Redirects to `/verify-otp` with password-reset purpose
- Error handling for rate limits

### 3. Reset Password Page
**Route:** `/auth/reset-password`

**Features:**
- Password strength indicator
- Real-time password validation
- Confirm password matching
- Show/hide password toggle
- Uses reset token from sessionStorage
- Password requirements checklist
- Auto-redirect to login on success

## Email Templates

### Email Service
**File:** `lib/email.ts`

**Current Implementation:** Console logging (development)

**Production Setup:**
Replace `sendEmail()` function with your email service:

```typescript
// Option 1: SendGrid
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(options: EmailOptions) {
  await sgMail.send({
    to: options.to,
    from: process.env.FROM_EMAIL!,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

// Option 2: AWS SES
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
const ses = new SESClient({ region: 'us-east-1' });

// Option 3: Nodemailer
import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({...});
```

### Email Content
Beautiful HTML email template included:
- Responsive design
- Purple gradient header
- Large, easy-to-read OTP code
- Security warnings
- Mobile-friendly
- Plain text fallback

## Usage Examples

### Example 1: Email Verification on Signup

```typescript
// After user signs up
const response = await fetch('/api/otp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: userEmail,
    purpose: 'signup'
  }),
});

// Redirect to verification
router.push(`/verify-otp?email=${email}&purpose=signup&redirect=/dashboard`);
```

### Example 2: Password Reset Flow

```typescript
// 1. User requests password reset
await fetch('/api/otp/send', {
  method: 'POST',
  body: JSON.stringify({
    email: userEmail,
    purpose: 'password-reset'
  }),
});

// 2. User verifies OTP
const verifyResponse = await fetch('/api/otp/verify', {
  method: 'POST',
  body: JSON.stringify({
    email: userEmail,
    otp: '123456',
    purpose: 'password-reset'
  }),
});

const { resetToken } = await verifyResponse.json();
sessionStorage.setItem('resetToken', resetToken);

// 3. User resets password
await fetch('/api/auth/reset-password', {
  method: 'POST',
  body: JSON.stringify({
    email: userEmail,
    password: newPassword,
    resetToken: sessionStorage.getItem('resetToken')
  }),
});
```

### Example 3: Two-Factor Authentication

```typescript
// After login credentials verified
await fetch('/api/otp/send', {
  method: 'POST',
  body: JSON.stringify({
    email: userEmail,
    purpose: 'login'
  }),
});

// Verify OTP before granting access
const response = await fetch('/api/otp/verify', {
  method: 'POST',
  body: JSON.stringify({
    email: userEmail,
    otp: userInputOtp,
    purpose: 'login'
  }),
});

if (response.ok) {
  // Grant access, set JWT token
}
```

## Security Features

### Rate Limiting
- **Per Email/Purpose:** Max 3 OTPs per hour
- **Resend Cooldown:** 60 seconds between resends
- **Stored in:** Memory (development) - Use Redis for production

### Attempt Limiting
- **Max Attempts:** 5 verification attempts per OTP
- **Auto-Expiry:** OTP expires after max attempts exceeded
- **Feedback:** Shows remaining attempts to user

### Token Security
- **OTP Expiry:** 10 minutes (configurable)
- **Reset Token Expiry:** 15 minutes
- **Auto-Cleanup:** MongoDB TTL index removes expired OTPs
- **One-Time Use:** OTP marked as verified and expired after successful verification

### Password Requirements
- Minimum 8 characters
- Strength scoring based on:
  - Length (8+ chars)
  - Uppercase letters
  - Lowercase letters
  - Numbers
  - Special characters

## Configuration

### Environment Variables
Add to `.env.local`:

```env
# Email Service (choose one)
SENDGRID_API_KEY=your_sendgrid_key
# or
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
# or
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your App Name
```

### Customizable Constants

**OTP Configuration** (`app/api/otp/send/route.ts`):
```typescript
const MAX_OTP_PER_HOUR = 3;              // Rate limit
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const OTP_EXPIRY_MINUTES = 10;           // OTP validity
```

**Verification Configuration** (`app/api/otp/verify/route.ts`):
```typescript
const MAX_ATTEMPTS = 5;  // Max verification attempts
```

**Resend Configuration** (`app/api/otp/resend/route.ts`):
```typescript
const RESEND_COOLDOWN = 60 * 1000;  // 60 seconds
const OTP_EXPIRY_MINUTES = 10;
```

**Reset Token Configuration** (`app/api/otp/verify/route.ts`):
```typescript
const resetTokenExpiry = 15 * 60 * 1000;  // 15 minutes
```

## Testing

### Development Testing
Since email is console-logged in development:

1. Start the app: `npm run dev`
2. Request OTP via `/auth/forgot-password`
3. Check terminal for OTP code:
   ```
   ============================================================
   📧 EMAIL SENT:
   To: user@example.com
   Subject: Password Reset Verification Code
   Content: Your verification code is: 123456
   ============================================================
   ```
4. Enter the code in `/verify-otp`

### API Testing with cURL

**Send OTP:**
```bash
curl -X POST http://localhost:3000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","purpose":"password-reset"}'
```

**Verify OTP:**
```bash
curl -X POST http://localhost:3000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","otp":"123456","purpose":"password-reset"}'
```

**Resend OTP:**
```bash
curl -X POST http://localhost:3000/api/otp/resend \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","purpose":"password-reset"}'
```

## Production Checklist

- [ ] Replace `sendEmail()` with production email service
- [ ] Add email service credentials to environment variables
- [ ] Test email delivery with real email addresses
- [ ] Replace in-memory rate limiting with Redis
- [ ] Configure FROM_EMAIL and FROM_NAME
- [ ] Test complete flows: signup, login, password reset
- [ ] Monitor OTP delivery rates and failures
- [ ] Set up email template customization
- [ ] Add email logging/tracking (optional)
- [ ] Test rate limiting and attempt limiting
- [ ] Verify MongoDB TTL index is working
- [ ] Set up email bounce/complaint handling

## Troubleshooting

### OTPs Not Expiring
- Check MongoDB TTL index: `db.otps.getIndexes()`
- TTL index runs every 60 seconds
- Manual cleanup: `db.otps.deleteMany({expiresAt: {$lt: new Date()}})`

### Rate Limiting Not Working
- In production, use Redis instead of memory Map
- Check if multiple instances are running (load balancer)

### Emails Not Sending
- Check environment variables
- Verify email service credentials
- Check console logs for error messages
- Test email service connection separately

### OTP Not Found Error
- Check if OTP expired (10-minute limit)
- Verify email matches exactly
- Check purpose matches
- Look for typos in email

## Files Created

1. `lib/models/OTP.ts` - Database model
2. `lib/email.ts` - Email utility and templates
3. `app/api/otp/send/route.ts` - Send OTP endpoint
4. `app/api/otp/verify/route.ts` - Verify OTP endpoint
5. `app/api/otp/resend/route.ts` - Resend OTP endpoint
6. `app/api/auth/reset-password/route.ts` - Reset password endpoint
7. `app/verify-otp/page.tsx` - OTP verification page
8. `app/auth/forgot-password/page.tsx` - Forgot password page
9. `app/auth/reset-password/page.tsx` - Reset password page

## Next Steps

1. **Integrate with Signup:** Add OTP verification after user registration
2. **Integrate with Login:** Add optional 2FA with OTP
3. **Add Email Service:** Connect SendGrid, AWS SES, or Nodemailer
4. **Add Redis:** Replace memory rate limiting for production
5. **Customize Templates:** Modify email templates for your brand
6. **Add Analytics:** Track OTP send/verify/failure rates
7. **Add Notifications:** Send alerts for suspicious activity

## Support

For questions or issues:
- Check MongoDB connection
- Verify all environment variables are set
- Check browser console for frontend errors
- Check server logs for API errors
- Ensure email is valid format

---

**Status:** ✅ Fully Implemented and Ready for Integration
**Last Updated:** 2024-01-15
