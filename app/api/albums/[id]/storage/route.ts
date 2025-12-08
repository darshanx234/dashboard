import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Album from '@/lib/models/Album';
import { StorageService } from '@/lib/services/storage.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/albums/[id]/storage - Get album storage information
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

    const albumId = params.id;

    // Get album and verify ownership
    const album = await Album.findById(albumId);
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    if (album.photographerId.toString() !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get storage information
    const storageInfo = await StorageService.getStorageInfo(albumId);

    return NextResponse.json({
      success: true,
      storage: storageInfo,
      album: {
        id: album._id,
        title: album.title,
        planName: album.planName,
        planExpiresAt: album.planExpiresAt,
        isExpired: album.isExpired,
      },
    });
  } catch (error: any) {
    console.error('Get Album Storage Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch album storage' },
      { status: 500 }
    );
  }
}

// POST /api/albums/[id]/storage/validate - Validate if a file can be uploaded
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
    const { fileSize } = body;

    if (!fileSize || fileSize <= 0) {
      return NextResponse.json(
        { error: 'Invalid file size' },
        { status: 400 }
      );
    }

    await connectDB();

    const albumId = params.id;

    // Get album and verify ownership
    const album = await Album.findById(albumId);
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    if (album.photographerId.toString() !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if file can be added
    const validation = await StorageService.canAddFile(albumId, fileSize);

    if (!validation.allowed) {
      return NextResponse.json(
        {
          success: false,
          allowed: false,
          error: validation.reason,
          storageInfo: validation.storageInfo,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      allowed: true,
      message: 'File can be uploaded',
    });
  } catch (error: any) {
    console.error('Validate Upload Error:', error);
    return NextResponse.json(
      { error: 'Failed to validate upload' },
      { status: 500 }
    );
  }
}
