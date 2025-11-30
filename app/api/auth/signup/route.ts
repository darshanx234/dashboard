import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken } from '@/lib/auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import OTP from '@/lib/models/OTP';
import { generateOTP, sendOTPEmail } from '@/lib/utils/email';

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

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Create new user (not verified yet)
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      isVerified: false,
    });

    // Generate OTP for email verification
    const otpCode = generateOTP();
    const OTP_EXPIRY_MINUTES = 10;
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Save OTP to database
    await OTP.create({
      email: email.toLowerCase(),
      otp: otpCode,
      purpose: 'signup',
      verified: false,
      attempts: 0,
      expiresAt,
    });

    // Send OTP via email
    const emailSent = await sendOTPEmail(email.toLowerCase(), otpCode, 'signup');

    if (!emailSent) {
      console.warn('Failed to send OTP email, but user was created');
      // Continue anyway - email can be resent
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
        message: 'User created successfully. Please verify your email.',
        requiresVerification: true,
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
        otpExpiresAt: expiresAt.toISOString(),
      },
      { status: 201 }
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
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
