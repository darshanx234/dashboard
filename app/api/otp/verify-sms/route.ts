import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import OTP from '@/lib/models/OTP';

const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { phone, otp, purpose = 'signup' } = body;

    // Validate input
    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    // Find the most recent OTP for this phone and purpose
    const otpRecord = await OTP.findOne({
      phone: phone,
      purpose,
      verified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: 'OTP expired or not found. Please request a new OTP.' },
        { status: 404 }
      );
    }

    // Check attempts
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { success: false, error: 'Maximum verification attempts exceeded. Please request a new OTP.' },
        { status: 429 }
      );
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();

      const remainingAttempts = MAX_ATTEMPTS - otpRecord.attempts;
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
          remainingAttempts 
        },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully',
      phone,
    });

  } catch (error: any) {
    console.error('Error verifying SMS OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
