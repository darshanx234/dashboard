import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import OTP from '@/lib/models/OTP';
import User from '@/lib/models/User';

const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { email, otp, purpose = 'email-verification' } = body;

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== 'string') {
      return NextResponse.json(
        { success: false, error: 'OTP is required' },
        { status: 400 }
      );
    }

    // Find the most recent unverified OTP for this email and purpose
    const otpRecord = await OTP.findOne({
      email,
      purpose,
      verified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    // Check if OTP exists
    if (!otpRecord) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OTP not found or expired. Please request a new one.',
          code: 'OTP_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      // Expire this OTP
      otpRecord.expiresAt = new Date();
      await otpRecord.save();

      return NextResponse.json(
        { 
          success: false, 
          error: 'Maximum verification attempts exceeded. Please request a new OTP.',
          code: 'MAX_ATTEMPTS_EXCEEDED'
        },
        { status: 429 }
      );
    }

    // Increment attempts
    otpRecord.attempts += 1;
    await otpRecord.save();

    // Verify OTP
    if (otpRecord.otp !== otp) {
      const remainingAttempts = MAX_ATTEMPTS - otpRecord.attempts;
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
          code: 'INVALID_OTP',
          remainingAttempts
        },
        { status: 400 }
      );
    }

    // OTP is valid - mark as verified
    otpRecord.verified = true;
    otpRecord.expiresAt = new Date(); // Expire immediately to prevent reuse
    await otpRecord.save();

    // Perform purpose-specific actions
    let responseData: any = {
      success: true,
      message: 'OTP verified successfully',
      email,
      purpose,
    };

    // Update user based on purpose
    if (purpose === 'email-verification' || purpose === 'signup') {
      // Mark user as verified
      await User.updateOne(
        { email },
        { $set: { isVerified: true } }
      );
      responseData.isVerified = true;
    }

    // For password-reset, return a token that can be used to reset password
    if (purpose === 'password-reset') {
      // Generate a temporary reset token (valid for 15 minutes)
      const resetToken = Buffer.from(
        `${email}:${Date.now() + 15 * 60 * 1000}`
      ).toString('base64');
      
      responseData.resetToken = resetToken;
      responseData.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
