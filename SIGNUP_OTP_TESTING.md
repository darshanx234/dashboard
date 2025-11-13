# Signup with OTP Verification - Testing Guide

## Quick Start

### 1. Start Development Server
```powershell
npm run dev
```

The app will run on `http://localhost:3000`

### 2. Navigate to Signup
- URL: `http://localhost:3000/signup`
- You should see the signup form with email and password fields

### 3. Fill Signup Form
- **Email:** Enter any email (e.g., test@example.com)
- **Password:** Enter at least 6 characters
- **Confirm Password:** Must match password
- Click **"Create Account"**

### 4. Wait for OTP Email
- You'll see "Account Created!" success message
- Check your **terminal/console** for OTP code
- Look for output like:
  ```
  ============================================================
  📧 EMAIL SENT:
  To: test@example.com
  Subject: Complete Your Registration - Verification Code
  Content: Your verification code is: 123456
  ============================================================
  ```

### 5. Verify OTP
- You'll be automatically redirected to `/verify-otp`
- You'll see 6 empty input boxes
- Enter the 6-digit code from terminal (e.g., 123456)
- The form will auto-submit when all digits are entered
- Or manually click verification

### 6. Success!
- OTP verified ✅
- You'll be redirected to `/dashboard`
- Account is now fully verified

---

## Step-by-Step Visual Flow

### Screen 1: Signup Form
```
┌─────────────────────────────────────┐
│         Create Account              │
├─────────────────────────────────────┤
│                                     │
│  Email:                             │
│  [you@example.com________________]  │
│                                     │
│  Password:                          │
│  [••••••••••••••________________]  │
│                                     │
│  Confirm Password:                  │
│  [••••••••••••••________________]  │
│                                     │
│         [Create Account]            │
│                                     │
│  Already have an account?           │
│  Sign in                            │
└─────────────────────────────────────┘
```

### Screen 2: Success Message (1.5 seconds)
```
┌─────────────────────────────────────┐
│                                     │
│              ✓                      │
│         Account Created!            │
│    Your account has been created    │
│            successfully.            │
│                                     │
│    Redirecting to dashboard...      │
│                                     │
└─────────────────────────────────────┘
```

### Screen 3: OTP Verification Page
```
┌─────────────────────────────────────┐
│          🔐 Verification Code       │
├─────────────────────────────────────┤
│  Complete Your Registration         │
│                                     │
│  Code sent to:                      │
│  test@example.com                   │
│                                     │
│  Enter Verification Code            │
│  [1] [2] [3] [4] [5] [6]           │
│                                     │
│  Code expires in: 9:45              │
│                                     │
│  Didn't receive the code?           │
│  [Resend Code] (in 55 seconds)      │
│                                     │
│  [Back to Login]                    │
└─────────────────────────────────────┘
```

### Screen 4: OTP Verified (Success)
```
┌─────────────────────────────────────┐
│                                     │
│              ✓                      │
│   Verification successful!          │
│         Redirecting...              │
│                                     │
└─────────────────────────────────────┘
```

---

## API Flow Diagram

```
1. SIGNUP SUBMISSION
   ┌──────────────────────┐
   │  User Form Submit    │
   │  email + password    │
   └──────────┬───────────┘
              │
              v
   ┌──────────────────────┐
   │ POST /api/auth/signup│
   └──────────┬───────────┘
              │
              v
2. ACCOUNT CREATION
   ┌──────────────────────┐
   │ Create User (not     │
   │ verified)            │
   │ Generate JWT token   │
   └──────────┬───────────┘
              │
              v
3. OTP GENERATION
   ┌──────────────────────┐
   │ Generate 6-digit OTP │
   │ Save to OTP table    │
   │ (10 min expiry)      │
   └──────────┬───────────┘
              │
              v
4. EMAIL SENDING
   ┌──────────────────────┐
   │ Send OTP via email   │
   │ (or console log)     │
   └──────────┬───────────┘
              │
              v
5. API RESPONSE
   ┌──────────────────────┐
   │ Return:              │
   │ - user object        │
   │ - token              │
   │ - otpExpiresAt       │
   │ - requiresVerification│
   └──────────┬───────────┘
              │
              v
6. FRONTEND REDIRECT
   ┌──────────────────────┐
   │ Show success (1.5s)  │
   │ Redirect to          │
   │ /verify-otp page     │
   └──────────┬───────────┘
              │
              v
7. OTP VERIFICATION
   ┌──────────────────────┐
   │ User enters 6-digit  │
   │ code                 │
   │ POST /api/otp/verify │
   └──────────┬───────────┘
              │
              v
8. VERIFICATION CHECK
   ┌──────────────────────┐
   │ Check OTP code       │
   │ Check attempts       │
   │ Check expiry         │
   │ Mark as verified     │
   └──────────┬───────────┘
              │
              v
9. USER UPDATE
   ┌──────────────────────┐
   │ Set isVerified=true  │
   │ on User record       │
   └──────────┬───────────┘
              │
              v
10. FINAL REDIRECT
    ┌──────────────────────┐
    │ Redirect to:         │
    │ /dashboard           │
    └──────────────────────┘
```

---

## Terminal Output Examples

### Successful Signup
```powershell
PS D:\project\dashboard> npm run dev

> dashboard@0.1.0 dev
> next dev

  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  - Environment:  .env.local

 ✓ Ready in 2.5s
 ✓ Compiled client and server successfully

============================================================
📧 EMAIL SENT:
To: test@example.com
Subject: Complete Your Registration - Verification Code
Content: Your verification code is: 456789
============================================================
```

### OTP Verification
```
============================================================
📧 EMAIL SENT:
To: test@example.com
Subject: Complete Your Registration - Verification Code
Content: Your verification code is: 456789
============================================================

[User enters 456789 in OTP form]

✓ User email verified successfully
✓ User redirected to dashboard
```

---

## Testing Scenarios

### ✅ Scenario 1: Normal Signup Flow
1. Fill signup form ✓
2. Click "Create Account" ✓
3. See success message ✓
4. Automatically redirected to OTP page ✓
5. See OTP code in terminal ✓
6. Enter OTP code ✓
7. OTP verified ✓
8. Redirected to dashboard ✓

### ⚠️ Scenario 2: Invalid Password
1. Fill email ✓
2. Enter password < 6 characters
3. Click "Create Account"
4. See error: "Password must be at least 6 characters" ✓
5. Not redirected ✓

### ⚠️ Scenario 3: Passwords Don't Match
1. Fill email ✓
2. Enter password ✓
3. Enter different confirm password
4. Click "Create Account"
5. See error: "Passwords do not match" ✓
6. Not redirected ✓

### ⚠️ Scenario 4: Duplicate Email
1. Sign up with email ✓
2. Complete OTP verification ✓
3. Try to sign up again with same email
4. See error: "User already exists" ✓
5. Redirected to login ✓

### ⚠️ Scenario 5: Wrong OTP Code
1. Complete signup ✓
2. See OTP page ✓
3. Enter wrong 6-digit code
4. See error: "Invalid OTP. 4 attempt(s) remaining." ✓
5. Can try again ✓

### ⚠️ Scenario 6: Max OTP Attempts
1. Complete signup ✓
2. Enter wrong code 5 times
3. See error: "Maximum verification attempts exceeded. Please request a new OTP." ✓
4. Must use "Resend Code" button ✓

### ⚠️ Scenario 7: OTP Expired (After 10 minutes)
1. Complete signup ✓
2. Wait 10+ minutes
3. Try to enter OTP
4. See error: "OTP not found or expired. Please request a new one." ✓
5. Use "Resend Code" button ✓

### ⚠️ Scenario 8: Resend OTP
1. Complete signup ✓
2. Click "Resend Code" immediately
3. See error: "Please wait X seconds before requesting a new OTP" ✓
4. After 60 seconds, button becomes active
5. Click "Resend Code" ✓
6. New OTP code in terminal ✓

---

## Browser Developer Tools Tips

### Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Sign up normally
4. You'll see:
   - `POST /api/auth/signup` - Check Response
   - `POST /api/otp/send` (called by signup API)
   - `POST /api/otp/verify` - When entering OTP

### Check Console
1. Open DevTools Console tab
2. Should see no errors
3. Can add breakpoints in code

### Check Application Storage
1. Go to Application tab
2. Local Storage
3. Look for `auth-storage` key
4. Should contain user and token data

---

## Common Issues & Solutions

### Issue: "OTP not found or expired"
**Solution:**
- Check if 10 minutes passed
- Check if OTP code is correct
- Use "Resend Code" button to get new OTP

### Issue: "Maximum verification attempts exceeded"
**Solution:**
- Wait and use "Resend Code" button
- This resets the attempt counter

### Issue: "User already exists"
**Solution:**
- Use different email address
- Or reset the database

### Issue: OTP Code Not Appearing in Terminal
**Solution:**
- Emails are logged to terminal in development
- Make sure terminal is visible
- Check if email service is misconfigured (for production)

### Issue: "Please wait X seconds before requesting a new OTP"
**Solution:**
- 60-second cooldown between resend requests
- This is intentional to prevent spam

### Issue: "Passwords do not match"
**Solution:**
- Make sure password and confirm password are identical
- Check for extra spaces

---

## Database Check (MongoDB)

### View Created Users
```bash
# Connect to MongoDB
mongosh

# Switch to your database
use your_db_name

# View all users
db.users.find().pretty()

# Check isVerified field
db.users.find({ email: "test@example.com" }, { email: 1, isVerified: 1 }).pretty()
```

### View OTP Records
```bash
# View OTPs for specific email
db.otps.find({ email: "test@example.com" }).pretty()

# View unverified OTPs
db.otps.find({ verified: false }).pretty()

# View expired OTPs (cleanup check)
db.otps.find({ expiresAt: { $lt: new Date() } }).pretty()
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Email service configured (SendGrid, AWS SES, etc.)
- [ ] Environment variables set correctly
- [ ] Test signup with real email address
- [ ] Verify email is received within 30 seconds
- [ ] Test complete flow: signup → OTP → verification → dashboard
- [ ] Test error cases
- [ ] Monitor logs for failed email sends
- [ ] Set up monitoring/alerts for OTP failures
- [ ] Configure TTL index for automatic OTP cleanup
- [ ] Test rate limiting (3 OTPs per hour per email)

---

## Summary

The signup flow is now integrated with OTP verification:

1. ✅ User signs up with email & password
2. ✅ Account created (not verified)
3. ✅ OTP generated and sent via email
4. ✅ User redirected to OTP verification page
5. ✅ User enters OTP code
6. ✅ Email verified, user redirected to dashboard

All with beautiful UI, proper error handling, and rate limiting! 🎉

---

**Next:** Configure your production email service and deploy! 🚀
