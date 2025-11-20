import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Album from '@/lib/models/Album';
import User from '@/lib/models/User';
import { generatePresignedDownloadUrl } from '@/lib/s3';
import { withAuthProtection, canManageAlbums, createForbiddenResponse } from '@/lib/auth/api-auth-helper';

// GET /api/albums - Get all albums for the logged-in photographer
export const GET = withAuthProtection(async (request: NextRequest, user) => {
  try {
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { photographerId: user.userId };
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
});

// POST /api/albums - Create a new album
export const POST = withAuthProtection(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    await connectDB();

    // Get user details
    const userDoc = await User.findById(user.userId);
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can manage albums (photographer or admin)
    if (!canManageAlbums(user)) {
      return createForbiddenResponse('Only photographers and admins can create albums');
    }

    // Create album
    const album = await Album.create({
      title: body.title,
      description: body.description,
      photographerId: user.userId,
      photographerName: userDoc.name || "default",
      photographerEmail: userDoc.email || "",
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
});
