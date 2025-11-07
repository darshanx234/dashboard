import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';

/**
 * GET - Get user profile
 */
export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);

    if (!auth.valid) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    await connectToDatabase();
    const user = await User.findById(auth.decoded!.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          avatar: user.avatar,
          phone: user.phone || '',
          bio: user.bio || '',
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = verifyAuth(request);

    if (!auth.valid) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { firstName, lastName, phone, bio, avatar } = body;

    await connectToDatabase();
    
    const user = await User.findByIdAndUpdate(
      auth.decoded!.userId,
      {
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || '',
        bio: bio || '',
        avatar: avatar || null,
        updatedAt: new Date(),
      },
      { new: true }
    );

    

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          avatar: user.avatar,
          phone: user.phone || '',
          bio: user.bio || '',
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
