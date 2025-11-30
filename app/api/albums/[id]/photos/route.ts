import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Album from '@/lib/models/Album';
import Photo from '@/lib/models/Photo';
import { generatePresignedDownloadUrl, deleteFromS3 } from '@/lib/utils/s3';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/albums/[id]/photos - Get all photos in an album
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    await connectDB();

    const { id } = await params;
    // Check album access
    const album = await Album.findById(id);
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
    const photos = await Photo.find({ albumId: id })
      .sort({ order: 1, createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Photo.countDocuments({ albumId: id });

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const body = await request.json();

    await connectDB();

    const { id } = await params;
    // Check album access
    const album = await Album.findById(id);
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const isOwner = album.photographerId.toString() === decoded.userId;
    if (!isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create photo record
    const photo = await Photo.create({
      albumId: id,
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
    await Album.findByIdAndUpdate(id, {
      $inc: { totalPhotos: 1 },
    });

    // Set cover photo if this is the first photo
    if (!album.coverPhoto) {
      await Album.findByIdAndUpdate(id, {
        coverPhoto: body.s3Url,
      });
    }

    const photoUrl = await generatePresignedDownloadUrl(photo.s3Key, 3600); // 1 hour expiry

    return NextResponse.json({
      message: 'Photo added successfully',
      photo: { ...photo.toObject?.(), url: photoUrl },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Add Photo Error:', error);
    return NextResponse.json({ error: 'Failed to add photo' }, { status: 500 });
  }
}

// DELETE /api/albums/[id]/photos - Delete multiple photos
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const body = await request.json();
    const { photoIds } = body;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json({ error: 'Photo IDs are required' }, { status: 400 });
    }

    await connectDB();

    const { id } = await params;
    // Check album access
    const album = await Album.findById(id);
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const isOwner = album.photographerId.toString() === decoded.userId;
    if (!isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get photos to delete
    const photos = await Photo.find({
      _id: { $in: photoIds },
      albumId: id,
    });

    if (photos.length === 0) {
      return NextResponse.json({ error: 'No photos found' }, { status: 404 });
    }

    // Delete from S3
    const deletePromises = photos.map(async (photo) => {
      try {
        await deleteFromS3(photo.s3Key);
      } catch (error) {
        console.error(`Failed to delete photo ${photo._id} from S3:`, error);
        // Continue even if S3 deletion fails
      }
    });

    await Promise.all(deletePromises);

    // Delete from database
    await Photo.deleteMany({
      _id: { $in: photoIds },
      albumId: id,
    });

    // Update album photo count
    await Album.findByIdAndUpdate(id, {
      $inc: { totalPhotos: -photos.length },
    });

    // If deleted photo was the cover photo, clear it
    const deletedS3Urls = photos.map(p => p.s3Url);
    if (album.coverPhoto && deletedS3Urls.includes(album.coverPhoto)) {
      await Album.findByIdAndUpdate(id, {
        coverPhoto: null,
      });
    }

    return NextResponse.json({
      message: `Successfully deleted ${photos.length} photo${photos.length > 1 ? 's' : ''}`,
      deletedCount: photos.length,
    });
  } catch (error: any) {
    console.error('Delete Photos Error:', error);
    return NextResponse.json({ error: 'Failed to delete photos' }, { status: 500 });
  }
}
