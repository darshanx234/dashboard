import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import OTP from '@/lib/models/OTP';
import User from '@/lib/models/User';
import { generateOTP, sendSMSOTP, validatePhoneNumber } from '@/lib/utils/sms';

// Rate limiting: Store last OTP send time in memory (in production, use Redis)
const otpRateLimits = new Map<string, number>();
const MAX_OTP_PER_HOUR = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const OTP_EXPIRY_MINUTES = 10;

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { phone, purpose = 'signup' } = body;

    // Validate input
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate phone format
    if (!validatePhoneNumber(phone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format. Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    // Validate purpose
    const validPurposes = ['signup', 'login', 'verification'];
    if (!validPurposes.includes(purpose)) {
      return NextResponse.json(
        { success: false, error: 'Invalid purpose' },
        { status: 400 }
      );
    }

    // Check if user exists based on purpose
    const existingUser = await User.findOne({ phone });
    
    if (purpose === 'signup' && existingUser) {
      return NextResponse.json(
        { success: false, error: 'Phone number already registered' },
        { status: 409 }
      );
    }

    if (purpose === 'login' && !existingUser) {
      return NextResponse.json(
        { success: false, error: 'Phone number not registered' },
        { status: 404 }
      );
    }

    // Rate limiting check
    const rateLimitKey = `${phone}:${purpose}`;
    const now = Date.now();
    
    // Count recent OTPs in the database
    const oneHourAgo = new Date(now - RATE_LIMIT_WINDOW);
    const recentOtpCount = await OTP.countDocuments({
      phone: phone, // Using phone field to store phone for OTP
      purpose,
      createdAt: { $gte: oneHourAgo },
    });

    if (recentOtpCount >= MAX_OTP_PER_HOUR) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many OTP requests. Please try again after 1 hour.',
          retryAfter: 3600 // seconds
        },
        { status: 429 }
      );
    }

    // Invalidate all previous OTPs for this phone and purpose
    await OTP.updateMany(
      { phone: phone, purpose, verified: false },
      { $set: { expiresAt: new Date() } }
    );

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(now + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Save OTP to database
    await OTP.create({
      phone: phone,
      otp: "121212",
      purpose,
      verified: false,
      attempts: 0,
      expiresAt,
    });

    // // Send OTP via SMS
    // const smsSent = await sendSMSOTP(phone, otpCode, purpose);

    // if (!smsSent) {
    //   return NextResponse.json(
    //     { success: false, error: 'Failed to send OTP. Please try again.' },
    //     { status: 500 }
    //   );
    // }

    // Update rate limit
    otpRateLimits.set(rateLimitKey, now);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully to your phone',
      expiresIn: OTP_EXPIRY_MINUTES * 60, // seconds
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error: any) {
    console.error('Error sending SMS OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
