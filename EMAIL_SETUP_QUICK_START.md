# Email Service - Quick Start Guide

## 1️⃣ What's New

✅ Nodemailer integrated for real email sending
✅ Support for Gmail, SMTP, SendGrid, Outlook, etc.
✅ Environment variable configuration
✅ Development fallback (console logging)
✅ Automatic transporter caching

---

## 2️⃣ Quick Setup (5 minutes)

### For Gmail (Easiest)

**Step 1: Create App Password**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification (if not done)
3. Click "App passwords"
4. Select Mail → Windows Computer
5. Copy the 16-character code

**Step 2: Update .env.local**
```env
EMAIL_SERVICE=gmail
FROM_EMAIL=your-gmail@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
FROM_NAME=PhotoAlumnus
```

**Step 3: Restart Dev Server**
```bash
# Press Ctrl+C to stop
# Then restart
npm run dev
```

**Step 4: Test**
- Go to http://localhost:3000/signup
- Sign up with any email
- Check your inbox for OTP email ✓

---

## 3️⃣ Alternative Setups

### For SendGrid
```env
FROM_EMAIL=noreply@yourdomain.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your_sendgrid_api_key
SMTP_SECURE=false
FROM_NAME=PhotoAlumnus
```

### For Custom SMTP
```env
FROM_EMAIL=your-email@yourdomain.com
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-password
SMTP_SECURE=false
FROM_NAME=PhotoAlumnus
```

### For Outlook/Microsoft 365
```env
FROM_EMAIL=your-email@company.com
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASSWORD=your-password
SMTP_SECURE=false
FROM_NAME=Company Name
```

---

## 4️⃣ File Reference

### Template File
📄 `.env.local.example` - Copy this and rename to `.env.local`

### Setup Guide
📄 `EMAIL_SERVICE_SETUP.md` - Detailed setup instructions

### Code
📄 `lib/email.ts` - Email service implementation

---

## 5️⃣ How It Works

### Environment Variable Priority
```
1. Check SMTP settings (SMTP_HOST, SMTP_PORT, etc.)
   ↓ Not set
2. Check Gmail settings (EMAIL_PASSWORD)
   ↓ Not set
3. Check other service (EMAIL_SERVICE)
   ↓ Not set
4. Development mode (console logging)
```

### Email Flow
```
Signup
  ↓
POST /api/auth/signup
  ↓
Create user + OTP
  ↓
sendOTPEmail()
  ↓
sendEmail()
  ↓
getTransporter()
  ↓
Initialize nodemailer (based on env)
  ↓
Send email via configured service
  ↓
Log success/failure
```

---

## 6️⃣ Verify It's Working

### Check Config on Startup
When you start the server, you should see:
```
📧 Email Service: Gmail
```
or
```
📧 Email Service: SMTP (smtp.sendgrid.net:587)
```
or
```
⚠️  Email service not configured. Using console logging for development.
```

### Test Signup
1. Go to http://localhost:3000/signup
2. Enter email and password
3. Click "Create Account"

**If configured:**
- Email sent to inbox
- See `✅ Email sent to ...` in terminal

**If not configured (development mode):**
- See email content in terminal
- Still works for testing

---

## 7️⃣ Common Issues

**Issue: "Email service not configured"**
- Set `FROM_EMAIL` in `.env.local`
- Restart dev server

**Issue: Gmail auth failed**
- Use **App Password** (not regular password)
- Must be 16 characters
- Enable 2-Step Verification first

**Issue: SMTP connection timeout**
- Verify SMTP host and port
- Check firewall allows outbound connection
- Try `SMTP_SECURE=true` if port 465

**Issue: Emails not received**
- Check spam folder
- Verify FROM_EMAIL is correct
- Check email service logs

---

## 8️⃣ Production Setup

### Environment Variables
Store securely in production:
- ✅ Use secrets manager (AWS Secrets, Vercel Env, etc.)
- ✅ Never commit to GitHub
- ✅ Use strong, unique credentials
- ✅ Rotate regularly

### Recommended for Production
- SendGrid (reliable, good deliverability)
- AWS SES (if using AWS)
- Mailgun (good documentation)
- Postmark (transactional emails)

### Setup Steps
1. Configure email service
2. Set environment variables in production
3. Verify sender domain (for SendGrid, Mailgun)
4. Test with real emails
5. Monitor delivery/bounce rates
6. Set up alerting

---

## 9️⃣ Testing Commands

### Signup Flow
```bash
# 1. Start dev server
npm run dev

# 2. In browser, go to signup
http://localhost:3000/signup

# 3. Fill form and submit
# 4. Check inbox or terminal for OTP
```

### Direct API Test
```bash
curl -X POST http://localhost:3000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","purpose":"signup"}'
```

---

## 🔟 Files Modified

| File | Changes |
|------|---------|
| `lib/email.ts` | Added Nodemailer + multi-service support |
| `.env.local.example` | Email config template |

## Packages Installed

```
nodemailer@6.9.7
@types/nodemailer@6.4.14
```

---

## Summary

✅ Email service fully configured with environment variables
✅ Support for Gmail, SMTP, SendGrid, Outlook, and more
✅ Development mode with console logging fallback
✅ Ready for production deployment
✅ Simple 5-minute setup

**Next Steps:**
1. Copy `.env.local.example` to `.env.local`
2. Add your email credentials
3. Restart dev server
4. Test signup flow
5. Deploy to production with real credentials!

---

**Status:** ✅ Ready to Use
**Complexity:** Easy
**Setup Time:** ~5 minutes
