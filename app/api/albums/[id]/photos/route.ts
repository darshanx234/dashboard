import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Album from '@/lib/models/Album';
import Photo from '@/lib/models/Photo';
import { generatePresignedDownloadUrl } from '@/lib/s3';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/albums/[id]/photos - Get all photos in an album
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    await connectDB();

    // Check album access
    const album = await Album.findById(params.id);
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const isOwner = album.photographerId.toString() === decoded.userId;
    if (!isOwner) {
      // TODO: Check if user has shared access
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Get photos with pagination
    const photos = await Photo.find({ albumId: params.id })
      .sort({ order: 1, createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Photo.countDocuments({ albumId: params.id });

    // Generate presigned URLs for each photo
    const photosWithUrls = await Promise.all(
      photos.map(async (photo: any) => {
        try {
          // Generate presigned URL for the main photo
          const signedUrl = await generatePresignedDownloadUrl(photo.s3Key, 3600); // 1 hour expiry

          return {
            ...photo,
            url: signedUrl,
            // Use the presigned URL for thumbnail as well (or keep existing if available)
            thumbnailUrl: signedUrl,
          };
        } catch (error) {
          console.error(`Failed to generate URL for photo ${photo._id}:`, error);
          // Return photo with fallback URL if signing fails
          return {
            ...photo,
            url: photo.s3Url,
            thumbnailUrl: photo.s3Url,
          };
        }
      })
    );

    return NextResponse.json({
      photos: photosWithUrls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get Photos Error:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

// POST /api/albums/[id]/photos - Create photo record (after S3 upload)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const body = await request.json();

    await connectDB();

    // Check album access
    const album = await Album.findById(params.id);
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const isOwner = album.photographerId.toString() === decoded.userId;
    if (!isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create photo record
    const photo = await Photo.create({
      albumId: params.id,
      photographerId: decoded.userId,
      filename: body.filename,
      originalName: body.originalName,
      s3Key: body.s3Key,
      s3Url: body.s3Url,
      thumbnailUrl: body.thumbnailUrl,
      fileSize: body.fileSize,
      mimeType: body.mimeType,
      width: body.width,
      height: body.height,
      capturedAt: body.capturedAt,
      camera: body.camera,
      lens: body.lens,
      settings: body.settings,
      order: body.order || 0,
      status: 'ready',
      isProcessed: true,
    });

    // Update album photo count
    await Album.findByIdAndUpdate(params.id, {
      $inc: { totalPhotos: 1 },
    });

    // Generate presigned URL for immediate access
    let photoWithUrl;
    try {
      const signedUrl = await generatePresignedDownloadUrl(photo.s3Key, 3600); // 1 hour expiry
      photoWithUrl = {
        ...photo.toObject(),
        url: signedUrl,
        thumbnailUrl: signedUrl,
      };
    } catch (error) {
      console.error('Failed to generate presigned URL:', error);
      // Fallback to S3 URL if presigned URL generation fails
      photoWithUrl = {
        ...photo.toObject(),
        url: photo.s3Url,
        thumbnailUrl: photo.s3Url,
      };
    }

    return NextResponse.json({
      message: 'Photo added successfully',
      photo: photoWithUrl,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Add Photo Error:', error);
    return NextResponse.json({ error: 'Failed to add photo' }, { status: 500 });
  }
}
