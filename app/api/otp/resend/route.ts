import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import OTP from '@/lib/models/OTP';
import { generateOTP, sendOTPEmail } from '@/lib/email';

const RESEND_COOLDOWN = 60 * 1000; // 60 seconds between resends
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

    // Check for recent OTP creation (cooldown)
    const lastOTP = await OTP.findOne({
      email,
      purpose,
    }).sort({ createdAt: -1 });

    if (lastOTP) {
      const timeSinceLastOTP = Date.now() - lastOTP.createdAt.getTime();
      
      if (timeSinceLastOTP < RESEND_COOLDOWN) {
        const remainingSeconds = Math.ceil((RESEND_COOLDOWN - timeSinceLastOTP) / 1000);
        
        return NextResponse.json(
          { 
            success: false, 
            error: `Please wait ${remainingSeconds} seconds before requesting a new OTP`,
            code: 'COOLDOWN_ACTIVE',
            retryAfter: remainingSeconds
          },
          { status: 429 }
        );
      }
    }

    // Check rate limiting (max 3 OTPs per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtpCount = await OTP.countDocuments({
      email,
      purpose,
      createdAt: { $gte: oneHourAgo },
    });

    if (recentOtpCount >= 3) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many OTP requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: 3600
        },
        { status: 429 }
      );
    }

    // Invalidate previous OTPs
    await OTP.updateMany(
      { email, purpose, verified: false },
      { $set: { expiresAt: new Date() } }
    );

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Save new OTP
    await OTP.create({
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

    return NextResponse.json({
      success: true,
      message: 'OTP resent successfully',
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      expiresAt: expiresAt.toISOString(),
      cooldown: RESEND_COOLDOWN / 1000, // seconds
    });

  } catch (error: any) {
    console.error('Error resending OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
