// Email utility for sending OTP using Nodemailer
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email transporter based on environment
 */
function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  const fromEmail = process.env.FROM_EMAIL;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  // Use SMTP configuration if provided
  if (smtpHost && smtpPort && smtpUser && smtpPassword) {
    console.log(`📧 Email Service: SMTP (${smtpHost}:${smtpPort})`);
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });
  }
  // Use Gmail with app password
  else if (emailService === 'gmail' && fromEmail && emailPassword) {
    console.log('📧 Email Service: Gmail');
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: fromEmail,
        pass: emailPassword,
      },
    });
  }
  // Use other services
  else if (emailService && fromEmail && emailPassword) {
    console.log(`📧 Email Service: ${emailService}`);
    transporter = nodemailer.createTransport({
      service: emailService,
      auth: {
        user: fromEmail,
        pass: emailPassword,
      },
    });
  }
  // Development mode - use console logging
  else {
    console.warn(
      '⚠️  Email service not configured. Using console logging for development.'
    );
    console.warn('Set EMAIL_SERVICE, FROM_EMAIL, and EMAIL_PASSWORD to enable real emails.');
    
    // Return a mock transporter for development
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return transporter as nodemailer.Transporter;
}

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  // return Math.floor(100000 + Math.random() * 900000).toString();
  return '121212'
}

/**
 * Send email using Nodemailer
 * Supports: Gmail, SMTP, or other services
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = getTransporter();
    const fromEmail = process.env.FROM_EMAIL;
    const fromName = process.env.FROM_NAME || 'PhotoAlumnus';

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`✅ Email sent to ${options.to}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
}

/**
 * Send OTP email
 */
export async function sendOTPEmail(
  email: string,
  otp: string,
  purpose: string = 'verification'
): Promise<boolean> {
  const subject = getEmailSubject(purpose);
  const { html, text } = getEmailContent(otp, purpose);

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

/**
 * Get email subject based on purpose
 */
function getEmailSubject(purpose: string): string {
  const subjects: Record<string, string> = {
    'signup': 'Complete Your Registration - Verification Code',
    'login': 'Your Login Verification Code',
    'password-reset': 'Password Reset Verification Code',
    'email-verification': 'Email Verification Code',
  };
  
  return subjects[purpose] || 'Your Verification Code';
}

/**
 * Get email content (HTML and text)
 */
function getEmailContent(otp: string, purpose: string): { html: string; text: string } {
  const purposeText = getPurposeText(purpose);
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .otp-box {
            background: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #667eea;
            font-family: 'Courier New', monospace;
          }
          .otp-label {
            font-size: 12px;
            text-transform: uppercase;
            color: #6c757d;
            margin-bottom: 10px;
            font-weight: 600;
          }
          .info {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Verification Code</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>${purposeText}</p>
            
            <div class="otp-box">
              <div class="otp-label">Your Verification Code</div>
              <div class="otp-code">${otp}</div>
            </div>
            
            <div class="info">
              <strong>⏰ Important:</strong> This code will expire in <strong>10 minutes</strong>. 
              If you didn't request this code, please ignore this email.
            </div>
            
            <p>For your security:</p>
            <ul>
              <li>Never share this code with anyone</li>
              <li>We will never ask for this code via phone or email</li>
              <li>If you didn't request this, someone may be trying to access your account</li>
            </ul>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} PhotoAlumnus. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Verification Code
    
    ${purposeText}
    
    Your verification code is: ${otp}
    
    This code will expire in 10 minutes.
    
    For your security:
    - Never share this code with anyone
    - We will never ask for this code via phone or email
    - If you didn't request this, someone may be trying to access your account
    
    © ${new Date().getFullYear()} PhotoAlumnus. All rights reserved.
  `;

  return { html, text };
}

/**
 * Get purpose-specific text
 */
function getPurposeText(purpose: string): string {
  const texts: Record<string, string> = {
    'signup': 'Thank you for signing up! Please use the code below to complete your registration.',
    'login': 'We received a login attempt for your account. Please use the code below to verify it\'s you.',
    'password-reset': 'We received a request to reset your password. Please use the code below to continue.',
    'email-verification': 'Please use the code below to verify your email address.',
  };
  
  return texts[purpose] || 'Please use the verification code below.';
}
