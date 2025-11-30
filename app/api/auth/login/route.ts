
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import OTP from '@/lib/models/OTP';
import { generateToken } from '@/lib/auth/jwt';
import { generateOTP, sendOTPEmail } from '@/lib/utils/email';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user and include password field for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Compare passwords
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user email is verified
    if (!user.isVerified) {
      // Generate new OTP for email verification
      const otpCode = generateOTP();
      const OTP_EXPIRY_MINUTES = 10;
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      // Invalidate previous OTPs for this email
      await OTP.updateMany(
        { email: email.toLowerCase(), verified: false },
        { $set: { expiresAt: new Date() } }
      );

      // Create new OTP
      await OTP.create({
        email: email.toLowerCase(),
        otp: otpCode,
        purpose: 'email-verification',
        verified: false,
        attempts: 0,
        expiresAt,
      });

      // Send OTP via email
      await sendOTPEmail(email.toLowerCase(), otpCode, 'email-verification');

      // Return response indicating email verification is required
      return NextResponse.json(
        {
          message: 'Please verify your email to complete login',
          requiresVerification: true,
          email: user.email,
          otpExpiresAt: expiresAt.toISOString(),
        },
        { status: 403 } // 403 Forbidden until verified
      );
    }

    // Generate token with role
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Create response with token in httpOnly cookie
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          bio: user.bio,
          avatar: user.avatar,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
