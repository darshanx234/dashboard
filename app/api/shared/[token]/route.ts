import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import AlbumShare from '@/lib/models/AlbumShare';
import Album from '@/lib/models/Album';
import Photo from '@/lib/models/Photo';
import bcrypt from 'bcryptjs';
import { generatePresignedDownloadUrl } from '@/lib/utils/s3';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/shared/[token] - Access shared album by token
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    await connectDB();

    // Find share by access token
    const share = await AlbumShare.findOne({
      accessToken: params.token,
      isActive: true,
    });

    if (!share) {
      return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 404 });
    }

    // Check expiration
    if (share.expiresAt && new Date() > share.expiresAt) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    // Check if password is required
    if (share.password) {
      // Verify access token from cookie
      const accessTokenCookie = request.cookies.get('share_access_token')?.value;
      
      if (!accessTokenCookie) {
        // No access token, password verification required
        return NextResponse.json({
          requiresPassword: true,
          error: 'Password verification required',
        }, { status: 403 });
      }

      try {
        // Verify the JWT token
        const decoded = jwt.verify(accessTokenCookie, JWT_SECRET) as any;
        
        // Check if token is for this share
        if (decoded.shareToken !== params.token) {
          return NextResponse.json({
            requiresPassword: true,
            error: 'Invalid access token',
          }, { status: 403 });
        }
      } catch (error) {
        // Token expired or invalid
        return NextResponse.json({
          requiresPassword: true,
          error: 'Access token expired',
        }, { status: 403 });
      }
    }

    // Get album details
    const album = await Album.findById(share.albumId);
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Get photos
    const photos = await Photo.find({
      albumId: share.albumId,
      status: 'ready',
    }).sort({ order: 1, createdAt: 1 });

    // Generate presigned URLs for photos
    const photosWithUrls = await Promise.all(
      photos.map(async (photo: any) => {
        try {
          const signedUrl = await generatePresignedDownloadUrl(photo.s3Key, 3600);
          return {
            _id: photo._id,
            filename: photo.filename,
            originalName: photo.originalName,
            url: signedUrl,
            thumbnailUrl: signedUrl,
            width: photo.width,
            height: photo.height,
            fileSize: photo.fileSize,
            mimeType: photo.mimeType,
            order: photo.order,
            views: photo.views,
            downloads: photo.downloads,
            favoritesCount: photo.favoritesCount,
          };
        } catch (error) {
          console.error(`Failed to generate URL for photo ${photo._id}:`, error);
          return {
            ...photo.toObject(),
            url: photo.s3Url,
            thumbnailUrl: photo.s3Url,
          };
        }
      })
    );

    // Update view count
    await AlbumShare.findByIdAndUpdate(share._id, {
      $inc: { views: 1 },
      lastViewedAt: new Date(),
    });

    await Album.findByIdAndUpdate(share.albumId, {
      $inc: { totalViews: 1 },
    });

    return NextResponse.json({
      album: {
        id: album._id,
        title: album.title,
        description: album.description,
        photographerName: album.photographerName,
        coverPhoto: album.coverPhoto,
        shootDate: album.shootDate,
        location: album.location,
        totalPhotos: album.totalPhotos,
      },
      photos: photosWithUrls,
      permissions: share.permissions,
      requiresPassword: !!share.password,
      shareType: share.shareType,
      expiresAt: share.expiresAt,
    });
  } catch (error: any) {
    console.error('Access Shared Album Error:', error);
    return NextResponse.json({ error: 'Failed to access album' }, { status: 500 });
  }
}
