import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Album from '@/lib/models/Album';
import User from '@/lib/models/User';
import { generatePresignedDownloadUrl } from '@/lib/utils/s3';
import { WalletService } from '@/lib/services/wallet.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ALBUM_CREATION_COST = 10; // Credits required to create an album

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

    // Validate plan selection
    const { planId } = body;
    if (!planId) {
      return NextResponse.json(
        { error: 'Plan selection is required' },
        { status: 400 }
      );
    }

    // Import AlbumPlanService
    const { AlbumPlanService } = await import('@/lib/services/album-plan.service');
    
    // Validate plan and check wallet balance
    const validation = await AlbumPlanService.validatePlanSelection(planId, decoded.userId);
    
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: validation.error,
          required: validation.plan?.price,
          current: validation.userBalance,
        },
        { status: 402 } // 402 Payment Required
      );
    }

    const plan = validation.plan!;

    // Create album with plan details
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + plan.durationDays);

    const album = await Album.create({
      title: body.title,
      description: body.description,
      photographerId: decoded.userId,
      photographerName: user.fullName || user.businessName || 'Photographer',
      photographerEmail: user.email || '',
      eventType: body.eventType || undefined,
      shootDate: body.shootDate || '',
      location: body.location || '',
      isPrivate: body.isPrivate || false,
      password: body.password, // Should be hashed if provided
      allowDownloads: body.allowDownloads !== false,
      allowFavorites: body.allowFavorites !== false,
      status: 'draft',
      // Plan-related fields
      planId: plan._id,
      planName: plan.name,
      planPrice: plan.price,
      storageLimit: plan.storageLimit,
      storageLimitGB: plan.storageLimitGB,
      storageUsed: 0,
      planExpiresAt: expiryDate,
      isExpired: false,
    });

    // Deduct credits from wallet
    try {
      await WalletService.deductCredits({
        userId: decoded.userId,
        amount: plan.price,
        category: 'album_creation',
        description: `Album created: ${album.title} (${plan.name} Plan)`,
        metadata: {
          albumId: album._id,
          albumTitle: album.title,
          planId: plan._id,
          planName: plan.name,
          planPrice: plan.price,
          storageLimit: plan.storageLimitGB,
        },
      });
    } catch (creditError: any) {
      // If credit deduction fails, delete the album and return error
      await Album.findByIdAndDelete(album._id);
      console.error('Error deducting credits:', creditError);
      return NextResponse.json(
        { error: 'Failed to process payment', message: creditError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Album created successfully',
      album: {
        ...album.toObject(),
        storageInfo: {
          used: 0,
          limit: plan.storageLimit,
          limitGB: plan.storageLimitGB,
          remaining: plan.storageLimit,
          percentage: 0,
        },
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create Album Error:', error);
    return NextResponse.json({ error: 'Failed to create album', message: error.message }, { status: 500 });
  }
}
