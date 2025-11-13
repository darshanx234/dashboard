# Email Service Setup Guide

## Overview
The email service is now fully configured with Nodemailer and supports multiple email providers. You can use Gmail, SMTP, or other services by setting environment variables.

---

## Quick Setup Options

### Option 1: Gmail (Recommended for Development)

#### 1. Create Google App Password
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (if not already enabled)
3. Go to **App passwords**
4. Select **Mail** and **Windows Computer**
5. Copy the 16-character password

#### 2. Add to `.env.local`
```env
# Gmail Configuration
EMAIL_SERVICE=gmail
FROM_EMAIL=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
FROM_NAME=PhotoAlumnus
```

---

### Option 2: SMTP (Any Email Provider)

#### 1. Get SMTP Credentials
From your email provider (Microsoft 365, custom SMTP, etc.):
- SMTP Host: `smtp.yourdomain.com`
- SMTP Port: `587` or `465`
- Username: `your-email@yourdomain.com`
- Password: `your-password`

#### 2. Add to `.env.local`
```env
# SMTP Configuration
EMAIL_SERVICE=smtp
FROM_EMAIL=your-email@yourdomain.com
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-password
SMTP_SECURE=false
FROM_NAME=PhotoAlumnus
```

**Note:** Set `SMTP_SECURE=true` if using port 465, `false` for port 587.

---

### Option 3: SendGrid (Production Recommended)

#### 1. Get SendGrid API Key
1. Go to [SendGrid](https://sendgrid.com/)
2. Create account and get API key
3. Or use alternative SMTP setup with SendGrid

#### 2. Add to `.env.local`
```env
# SendGrid SMTP Configuration
EMAIL_SERVICE=smtp
FROM_EMAIL=noreply@yourdomain.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your_sendgrid_api_key
SMTP_SECURE=false
FROM_NAME=PhotoAlumnus
```

---

### Option 4: Outlook/Microsoft 365

#### 1. Get SMTP Details
```
SMTP Host: smtp.office365.com
SMTP Port: 587
Username: your-email@yourcompany.com
Password: your-password
```

#### 2. Add to `.env.local`
```env
# Outlook/Microsoft 365
EMAIL_SERVICE=outlook
FROM_EMAIL=your-email@yourcompany.com
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@yourcompany.com
SMTP_PASSWORD=your-password
SMTP_SECURE=false
FROM_NAME=PhotoAlumnus
```

---

## Environment Variables Reference

### Required Variables
```env
FROM_EMAIL=your-email@example.com     # Email address to send from
FROM_NAME=PhotoAlumnus                # Display name in emails
```

### For Gmail
```env
EMAIL_SERVICE=gmail
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx   # 16-char app password
```

### For SMTP (Any Provider)
```env
SMTP_HOST=smtp.example.com           # SMTP server address
SMTP_PORT=587                         # Usually 587 or 465
SMTP_USER=your-email@example.com     # SMTP username
SMTP_PASSWORD=your-password           # SMTP password
SMTP_SECURE=false                     # true for 465, false for 587
```

### Optional
```env
EMAIL_SERVICE=custom-service-name    # For other services
```

---

## Complete `.env.local` Examples

### Example 1: Gmail Development Setup
```env
# Email Service
EMAIL_SERVICE=gmail
FROM_EMAIL=your-gmail@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
FROM_NAME=PhotoAlumnus

# Database
MONGODB_URI=mongodb://localhost:27017/dashboard

# Other configs...
```

### Example 2: SendGrid Production Setup
```env
# Email Service (SendGrid SMTP)
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=PhotoAlumnus
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your_sendgrid_api_key_here
SMTP_SECURE=false

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dashboard

# Other configs...
```

### Example 3: Custom SMTP (Any Provider)
```env
# Email Service
FROM_EMAIL=support@yourdomain.com
FROM_NAME=Your App Name
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=support@yourdomain.com
SMTP_PASSWORD=your_smtp_password
SMTP_SECURE=false

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dashboard

# Other configs...
```

---

## How It Works

### Initialization Flow
```
App Starts
  ↓
getTransporter() called on first email
  ↓
Check SMTP settings (highest priority)
  ↓ No SMTP
Check Gmail settings
  ↓ No Gmail
Check other service
  ↓ No service configured
Use development mock (console logging)
  ↓
Cache transporter for reuse
```

### Email Sending Flow
```
sendEmail() called
  ↓
Get transporter (from cache or initialize)
  ↓
Format email (from, to, subject, html, text)
  ↓
Send via Nodemailer
  ↓
Log success/failure
  ↓
Return boolean result
```

---

## Testing Email Configuration

### Test in Development
1. Start dev server
2. Sign up with any email
3. Check terminal for email output
4. If configured, check actual email inbox

### Test Sending
```bash
# Simple test
curl -X POST http://localhost:3000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","purpose":"signup"}'
```

### Check Configuration
Run this in your Next.js app:
```typescript
import { getTransporter } from '@/lib/email';

// In your code
const transporter = getTransporter();
console.log('Email transporter ready!');
```

---

## Troubleshooting

### Issue: "Email service not configured"
**Solution:**
- Add `FROM_EMAIL` to `.env.local`
- Add email credentials (either Gmail or SMTP)
- Restart dev server

### Issue: Gmail Authentication Failed
**Solution:**
- Use **App Password**, not regular password
- Must be 16-character code from Google
- Enable 2-Step Verification first

### Issue: SMTP Connection Timeout
**Solution:**
- Check SMTP host is correct
- Verify port (usually 587)
- Check firewall allows outgoing on that port
- Try `SMTP_SECURE=true` if port 465

### Issue: "Authentication Failed"
**Solution:**
- Verify username and password
- Check email/password has no extra spaces
- Some services require email as username
- Check if 2FA is enabled (may need app password)

### Issue: Emails Not Received
**Solution:**
- Check spam/junk folder
- Verify `FROM_EMAIL` matches sending account
- Check if provider has rate limiting
- Verify email content isn't triggering filters

### Issue: "Port 465 vs 587"
- **Port 465:** SMTP with SSL/TLS from the start → `SMTP_SECURE=true`
- **Port 587:** SMTP with TLS upgrade → `SMTP_SECURE=false`

---

## Service-Specific Guides

### Gmail Setup (Detailed)

1. **Enable 2-Step Verification**
   - Go to https://myaccount.google.com
   - Security → 2-Step Verification
   - Follow prompts

2. **Create App Password**
   - Security → App passwords
   - Select "Mail" and "Windows Computer"
   - Google generates 16-char password
   - Copy (don't include spaces in env var, they'll be removed)

3. **Add to .env.local**
   ```env
   EMAIL_SERVICE=gmail
   FROM_EMAIL=yourname@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   FROM_NAME=PhotoAlumnus
   ```

4. **Test**
   - Restart dev server
   - Sign up and check inbox
   - Should receive OTP email

---

### SendGrid Setup (Detailed)

1. **Create SendGrid Account**
   - Go to https://sendgrid.com
   - Sign up
   - Create API key (Settings → API Keys)

2. **Add to .env.local** (Using SMTP)
   ```env
   FROM_EMAIL=noreply@yourdomain.com
   FROM_NAME=Your App
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=SG.xxxxxxxxxxxxx
   SMTP_SECURE=false
   ```

3. **Verify Sender Domain** (Production)
   - SendGrid requires sender verification
   - Add custom domain
   - Update DNS records
   - Use verified address in FROM_EMAIL

---

### Microsoft 365 / Outlook Setup

1. **Get SMTP Details**
   - https://outlook.office.com
   - Settings → Advanced Email Settings
   - SMTP: smtp.office365.com
   - Port: 587

2. **Enable SMTP**
   - May need to enable app password
   - Or use regular password

3. **Add to .env.local**
   ```env
   EMAIL_SERVICE=outlook
   FROM_EMAIL=your-email@company.com
   SMTP_HOST=smtp.office365.com
   SMTP_PORT=587
   SMTP_USER=your-email@company.com
   SMTP_PASSWORD=your-password
   SMTP_SECURE=false
   FROM_NAME=Company Name
   ```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Email service configured
- [ ] Environment variables set in production
- [ ] FROM_EMAIL is valid/verified
- [ ] Test email sending works
- [ ] Check email delivery logs
- [ ] Set up bounce/complaint handling
- [ ] Monitor failed email sends

### Environment Variables (Production)
```env
# Use strong, unique credentials
# Store in production environment (not GitHub)
# Use secrets manager (AWS Secrets, Heroku Config Vars, etc.)

FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your Company Name
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.very_long_api_key_here
SMTP_SECURE=false
```

### Monitoring
- Track email send failures
- Monitor bounce rates
- Check spam complaints
- Set up alerts for errors

---

## Code Changes

### What Changed
File: `lib/email.ts`

**New Features:**
- ✅ Nodemailer integration
- ✅ Gmail support
- ✅ SMTP support (any provider)
- ✅ Multiple service support
- ✅ Development fallback
- ✅ Caching transporter
- ✅ Environment variable configuration

**Key Functions:**
```typescript
// Get or initialize transporter
function getTransporter(): nodemailer.Transporter

// Generate 6-digit OTP
export function generateOTP(): string

// Send email with all details
export async function sendEmail(options: EmailOptions): Promise<boolean>

// Send OTP email (uses sendEmail internally)
export async function sendOTPEmail(email, otp, purpose): Promise<boolean>
```

---

## Security Best Practices

✅ **Never commit credentials to GitHub**
- Use `.env.local` (in `.gitignore`)
- Use production secrets manager
- Rotate passwords regularly

✅ **Use app-specific passwords**
- Gmail: Use 16-char app password
- Microsoft: Generate app password
- Others: Create service accounts

✅ **Limit SMTP scope**
- Only allow send permission
- Use dedicated accounts
- Monitor usage

✅ **Validate email addresses**
- Check format before sending
- Implement rate limiting
- Monitor bounce rates

---

## FAQs

**Q: What if I don't set up email?**
A: Emails will be logged to console (development mode). Sign up flow will still work.

**Q: Can I use multiple email services?**
A: Currently supports one service. Modify `getTransporter()` to add fallback logic.

**Q: Which service is best?**
A: 
- **Development:** Gmail (easy setup)
- **Small-scale:** Mailgun or SendGrid free tier
- **Enterprise:** Dedicated SMTP server
- **AWS users:** AWS SES

**Q: How do I test email sending?**
A: Just sign up! Check terminal for development mode or email inbox for real service.

**Q: What about rate limiting?**
A: Use email service's rate limits. SendGrid: 100/sec free, Gmail: 500/day.

**Q: How to track email delivery?**
A: Services like SendGrid provide webhooks. Implement in `/api/webhooks/email`.

---

## File Modified

- `lib/email.ts` - Added Nodemailer integration with multi-service support

## Packages Installed

- `nodemailer` - Email sending library
- `@types/nodemailer` - TypeScript types

---

## Next Steps

1. ✅ Email service code ready
2. 🔄 Configure `.env.local` with your email
3. 🔄 Test signup flow
4. 🔄 Deploy to production with real credentials

---

**Status:** ✅ Email Transport Ready  
**Setup Time:** ~5 minutes  
**Complexity:** Easy
