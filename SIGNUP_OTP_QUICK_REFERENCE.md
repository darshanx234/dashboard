# Signup OTP Integration - Quick Reference

## What Changed

### Modified Files
1. ✅ `app/api/auth/signup/route.ts` - Auto-generates & sends OTP after signup
2. ✅ `components/auth/signup-form.tsx` - Redirects to OTP verification page

### New Flow
```
Signup → Account Created → OTP Sent → OTP Page → Verify → Dashboard
```

### Old Flow (Before)
```
Signup → Account Created → Dashboard
```

---

## Quick Test

### 1. Start Dev Server
```powershell
npm run dev
```

### 2. Sign Up
- Go to http://localhost:3000/signup
- Enter email and password
- Click "Create Account"

### 3. Get OTP Code
- Check terminal for output:
  ```
  📧 EMAIL SENT:
  To: your@email.com
  Subject: Complete Your Registration - Verification Code
  Content: Your verification code is: 123456
  ```

### 4. Verify
- Auto-redirected to `/verify-otp`
- Enter the 6-digit code
- Auto-submits
- Redirected to dashboard

---

## API Changes

### Signup API Response (Updated)
```json
{
  "message": "User created successfully. Please verify your email.",
  "requiresVerification": true,
  "user": { /* ... */ },
  "token": "jwt...",
  "otpExpiresAt": "2024-01-15T10:30:00.000Z"
}
```

### User Created With
```javascript
{
  email: "user@example.com",
  password: "hashedPassword",
  isVerified: false  // ← Not verified initially
}
```

### OTP Created With
```javascript
{
  email: "user@example.com",
  otp: "123456",
  purpose: "signup",
  verified: false,
  attempts: 0,
  expiresAt: Date // 10 minutes from now
}
```

---

## Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/signup` | POST | Create account & send OTP |
| `/api/otp/verify` | POST | Verify OTP code |
| `/api/otp/resend` | POST | Resend OTP (60s cooldown) |
| `/verify-otp` | GET | OTP verification page |

---

## Status Values

### On Signup API Response
- `requiresVerification: true` - User must verify email

### On User Record
- `isVerified: false` - User email not verified yet
- `isVerified: true` - After OTP verification ✓

### On OTP Record
- `verified: false` - OTP not used yet
- `verified: true` - After successful verification

---

## Error Messages

| Error | What Happened | How to Fix |
|-------|---------------|-----------|
| "Email and password are required" | Missing field | Fill all fields |
| "Password must be at least 6 characters" | Password too short | Use 6+ characters |
| "Invalid email format" | Bad email | Fix email format |
| "User already exists" | Duplicate email | Use different email |
| "Invalid OTP" | Wrong code | Check terminal for correct code |
| "Maximum verification attempts exceeded" | Too many tries | Use "Resend Code" button |
| "OTP not found or expired" | Code expired (10 min) | Use "Resend Code" button |
| "Please wait X seconds..." | Resend cooldown | Wait before resending |

---

## Files for Reference

### Core OTP Files (Created Earlier)
- `lib/models/OTP.ts` - Database model
- `lib/email.ts` - Email sending
- `app/api/otp/send/route.ts` - Send OTP
- `app/api/otp/verify/route.ts` - Verify OTP
- `app/api/otp/resend/route.ts` - Resend OTP
- `app/verify-otp/page.tsx` - OTP input page

### Documentation
- `OTP_SYSTEM_DOCUMENTATION.md` - Complete technical docs
- `OTP_INTEGRATION_EXAMPLES.md` - Integration examples
- `SIGNUP_OTP_INTEGRATION.md` - This integration overview
- `SIGNUP_OTP_TESTING.md` - Testing guide

---

## For Production

### Email Service Setup
Update `lib/email.ts`:

```typescript
// Replace console.log with real email service
import sgMail from '@sendgrid/mail';

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
```env
SENDGRID_API_KEY=your_key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your App Name
```

---

## Feature Summary

✅ Auto-generate 6-digit OTP after signup
✅ Send OTP via email
✅ Redirect to beautiful OTP verification page
✅ Auto-submit when OTP complete
✅ Countdown timer (expires in 10 min)
✅ Resend OTP (60-second cooldown)
✅ Max 5 verification attempts
✅ Rate limit 3 OTPs per hour
✅ User marked verified after successful OTP
✅ Redirects to dashboard on success

---

## Database Cleanup

### MongoDB TTL Index
OTP records automatically deleted after 10 minutes:
```javascript
// In OTP.ts schema
expiresAt: { type: Date, index: { expires: 0 } }
```

No manual cleanup needed! ✓

---

## Security

- ✅ OTP expires in 10 minutes
- ✅ Max 5 verification attempts
- ✅ Rate limited 3 per hour per email
- ✅ Email format validated
- ✅ Password hashed
- ✅ HTTPOnly cookies for JWT

---

## Next Steps

1. ✅ OTP system implemented
2. ✅ Signup flow integrated
3. 🔄 Configure email service
4. 🔄 Test with real emails
5. 🔄 Deploy to production

---

## Troubleshooting

**OTP code not in terminal?**
- Check terminal is visible
- Scroll up to see earlier output
- In production, check email inbox

**Wrong OTP error?**
- Copy exact code from terminal (with leading zeros)
- No spaces or dashes
- Check you're using latest code

**Account created but can't log in?**
- Account created with `isVerified: false`
- Must verify email first
- Use forgot password → set new password → verify

---

## Testing Commands

```bash
# Test signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Response includes otpExpiresAt
```

---

**Status:** ✅ Ready to Use  
**Email Service:** 🔄 Needs Configuration  
**Testing:** ✅ Ready (Check Terminal for OTP)
