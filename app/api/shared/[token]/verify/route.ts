import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AlbumShare from '@/lib/models/AlbumShare';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/shared/[token]/verify - Verify password for protected album
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json();
    await connectDB();

    // Find share by access token
    const share = await AlbumShare.findOne({
      accessToken: params.token,
      isActive: true,
    });

    if (!share) {
      return NextResponse.json({ error: 'Invalid share link' }, { status: 404 });
    }

    // Check if password is required
    if (!share.password) {
      return NextResponse.json({ verified: true });
    }

    // Verify password
    const isValid = await bcrypt.compare(body.password, share.password);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Generate short-lived access token (1 hour)
    const accessToken = jwt.sign(
      {
        shareToken: params.token,
        albumId: share.albumId.toString(),
        shareId: share._id.toString(),
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Set HTTP-only cookie with the access token
    const response = NextResponse.json({ 
      verified: true,
      accessToken,
      expiresIn: 3600, // 1 hour in seconds
    });

    response.cookies.set('share_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
    //   path: `/shared/${params.token}`,
    });

    return response;
  } catch (error: any) {
    console.error('Verify Password Error:', error);
    return NextResponse.json({ error: 'Failed to verify password' }, { status: 500 });
  }
}
