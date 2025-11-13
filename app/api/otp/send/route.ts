import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import OTP from '@/lib/models/OTP';
import User from '@/lib/models/User';
import { generateOTP, sendOTPEmail } from '@/lib/email';

// Rate limiting: Store last OTP send time in memory (in production, use Redis)
const otpRateLimits = new Map<string, number>();
const MAX_OTP_PER_HOUR = 3;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const OTP_EXPIRY_MINUTES = 10;

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { email, purpose = 'email-verification' } = body;

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate purpose
    const validPurposes = ['signup', 'login', 'password-reset', 'email-verification'];
    if (!validPurposes.includes(purpose)) {
      return NextResponse.json(
        { success: false, error: 'Invalid purpose' },
        { status: 400 }
      );
    }

    // Check if user exists (optional, depends on purpose)
    if (purpose === 'login' || purpose === 'password-reset') {
      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
    }

    // Rate limiting check
    const rateLimitKey = `${email}:${purpose}`;
    const now = Date.now();
    const lastOtpTimes = otpRateLimits.get(rateLimitKey) || 0;
    
    // Count recent OTPs in the database
    const oneHourAgo = new Date(now - RATE_LIMIT_WINDOW);
    const recentOtpCount = await OTP.countDocuments({
      email,
      purpose,
      createdAt: { $gte: oneHourAgo },
    });

    if (recentOtpCount >= MAX_OTP_PER_HOUR) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many OTP requests. Please try again later.',
          retryAfter: 3600 // seconds
        },
        { status: 429 }
      );
    }

    // Invalidate all previous OTPs for this email and purpose
    await OTP.updateMany(
      { email, purpose, verified: false },
      { $set: { expiresAt: new Date() } }
    );

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(now + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Save OTP to database
    const newOTP = await OTP.create({
      email,
      otp: otpCode,
      purpose,
      verified: false,
      attempts: 0,
      expiresAt,
    });

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otpCode, purpose);

    if (!emailSent) {
      return NextResponse.json(
        { success: false, error: 'Failed to send OTP email' },
        { status: 500 }
      );
    }

    // Update rate limit
    otpRateLimits.set(rateLimitKey, now);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: OTP_EXPIRY_MINUTES * 60, // seconds
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
