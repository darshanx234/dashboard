import { connectToDatabase } from '@/lib/db';
import User, { IUser } from '@/lib/models/User';
import OTP from '@/lib/models/OTP';
import { generateToken } from '@/lib/auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { 
      phone, 
      userType, 
      firstName, 
      businessName, 
      email, 
      password 
    } = body;

    // Validation
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!userType || !['photographer', 'studio_owner'].includes(userType)) {
      return NextResponse.json(
        { error: 'Valid user type is required (photographer or studio_owner)' },
        { status: 400 }
      );
    }

    // Validate based on user type
    if (userType === 'photographer' && !firstName) {
      return NextResponse.json(
        { error: 'Name is required for photographers' },
        { status: 400 }
      );
    }

    if (userType === 'studio_owner' && !businessName) {
      return NextResponse.json(
        { error: 'Business name is required for studio owners' },
        { status: 400 }
      );
    }

    // Validate phone format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Validate password if provided
    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if phone number is verified
    const verifiedOTP = await OTP.findOne({
      phone: phone, // Using phone field to store phone
      purpose: 'signup',
      verified: true,
      expiresAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) }, // Valid for 30 minutes after verification
    }).sort({ createdAt: -1 });

    if (!verifiedOTP) {
      return NextResponse.json(
        { error: 'Phone number not verified. Please verify your phone number first.' },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this phone number' },
        { status: 409 }
      );
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmailUser = await User.findOne({ email: email.toLowerCase() });
      if (existingEmailUser) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }
    }

    // Create user data object
    const userData: Partial<IUser> = {
      phone,
      userType,
      isVerified: true, // Phone is already verified
      role: 'photographer', // Default role
    };

    // Add optional fields
    if (userType === 'photographer' && firstName) {
      userData.firstName = firstName;
    }

    if (userType === 'studio_owner' && businessName) {
      userData.businessName = businessName;
    }

    if (email) {
      userData.email = email.toLowerCase();
    }

    if (password && password.trim().length > 0) {
      userData.password = password;
    }

    // Create new user
    const user = await User.create(userData) as IUser;

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      phone: user.phone,
      email: user.email,
      role: user.role,
    });

    // Create response with token in httpOnly cookie
    const response = NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: user._id,
          phone: user.phone,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          businessName: user.businessName,
          avatar: user.avatar,
          bio: user.bio,
          userType: user.userType,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
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
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        { error: `${field} already exists` },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
