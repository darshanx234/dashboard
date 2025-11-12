import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Album from '@/lib/models/Album';
import User from '@/lib/models/User';
import { generatePresignedDownloadUrl } from '@/lib/s3';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/albums - Get all albums for the logged-in photographer
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { photographerId: decoded.userId };
    if (status) {
      query.status = status;
    }

    // Get albums with pagination
    const albums = await Album.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Album.countDocuments(query);

    // Generate presigned URLs for cover photos
    const albumsWithUrls = await Promise.all(
      albums.map(async (album: any) => {
        if (album.coverPhoto) {
          try {
            // Extract S3 key from coverPhoto URL if it's a full URL
            let s3Key = album.coverPhoto;
            if (album.coverPhoto.includes('amazonaws.com/')) {
              s3Key = album.coverPhoto.split('amazonaws.com/')[1];
            }
            
            const signedUrl = await generatePresignedDownloadUrl(s3Key, 3600); // 1 hour expiry
            return {
              ...album,
              coverPhoto: signedUrl,
            };
          } catch (error) {
            console.error(`Failed to generate URL for album ${album._id}:`, error);
            // Return album with original coverPhoto if signing fails
            return album;
          }
        }
        return album;
      })
    );

    return NextResponse.json({
      albums: albumsWithUrls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get Albums Error:', error);
    return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 });
  }
}

// POST /api/albums - Create a new album
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const body = await request.json();

    await connectDB();

    // Get user details
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is photographer or admin
    if (user.role !== 'photographer' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Only photographers can create albums' }, { status: 403 });
    }

    // Create album
    const album = await Album.create({
      title: body.title,
      description: body.description,
      photographerId: decoded.userId,
      photographerName: user.name || "default",
      photographerEmail: user.email || "",
      shootDate: body.shootDate || "",
      location: body.location || "",
      isPrivate: body.isPrivate || false,
      password: body.password, // Should be hashed if provided
      allowDownloads: body.allowDownloads !== false,
      allowFavorites: body.allowFavorites !== false,
      status: 'draft',
    });

    return NextResponse.json({
      message: 'Album created successfully',
      album,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create Album Error:', error);
    return NextResponse.json({ error: 'Failed to create album' }, { status: 500 });
  }
}
