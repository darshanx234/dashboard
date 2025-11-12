import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Album from '@/lib/models/Album';
import Photo from '@/lib/models/Photo';
import { deleteFromS3, generatePresignedDownloadUrl } from '@/lib/s3';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/albums/[id] - Get album details
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

    const album = await Album.findById(params.id);

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Check access permissions
    const isOwner = album.photographerId.toString() === decoded.userId;
    
    if (!isOwner) {
      // TODO: Check if user has shared access
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Generate presigned URL for cover photo if exists
    let albumWithUrl = album.toObject();
    if (album.coverPhoto) {
      try {
        // Extract S3 key from coverPhoto URL if it's a full URL
        let s3Key = album.coverPhoto;
        if (album.coverPhoto.includes('amazonaws.com/')) {
          s3Key = album.coverPhoto.split('amazonaws.com/')[1];
        }
        
        const signedUrl = await generatePresignedDownloadUrl(s3Key, 3600); // 1 hour expiry
        albumWithUrl.coverPhoto = signedUrl;
      } catch (error) {
        console.error('Failed to generate presigned URL for cover photo:', error);
        // Keep original coverPhoto if signing fails
      }
    }

    return NextResponse.json({ album: albumWithUrl });
  } catch (error: any) {
    console.error('Get Album Error:', error);
    return NextResponse.json({ error: 'Failed to fetch album' }, { status: 500 });
  }
}

// PUT /api/albums/[id] - Update album
export async function PUT(
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

    const album = await Album.findById(params.id);

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Check if user is the owner
    if (album.photographerId.toString() !== decoded.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update album
    const updatedAlbum = await Album.findByIdAndUpdate(
      params.id,
      {
        title: body.title,
        description: body.description,
        shootDate: body.shootDate,
        location: body.location,
        isPrivate: body.isPrivate,
        password: body.password,
        allowDownloads: body.allowDownloads,
        allowFavorites: body.allowFavorites,
        status: body.status,
        coverPhoto: body.coverPhoto,
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      message: 'Album updated successfully',
      album: updatedAlbum,
    });
  } catch (error: any) {
    console.error('Update Album Error:', error);
    return NextResponse.json({ error: 'Failed to update album' }, { status: 500 });
  }
}

// DELETE /api/albums/[id] - Delete album and all its photos
export async function DELETE(
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

    const album = await Album.findById(params.id);

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Check if user is the owner
    if (album.photographerId.toString() !== decoded.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all photos in the album
    const photos = await Photo.find({ albumId: params.id });

    // Delete all photos from S3
    const s3Keys = photos.map((photo) => photo.s3Key);
    if (s3Keys.length > 0) {
      try {
        await Promise.all(s3Keys.map((key) => deleteFromS3(key)));
      } catch (s3Error) {
        console.error('S3 Delete Error:', s3Error);
        // Continue with database deletion even if S3 fails
      }
    }

    // Delete photos from database
    await Photo.deleteMany({ albumId: params.id });

    // Delete album
    await Album.findByIdAndDelete(params.id);

    return NextResponse.json({
      message: 'Album and all photos deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete Album Error:', error);
    return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 });
  }
}
