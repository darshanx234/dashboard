import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Album from '@/lib/models/Album';
import AlbumShare from '@/lib/models/AlbumShare';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/albums/[id]/share - Share album with users or generate public/private link
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
      return NextResponse.json({ error: 'Only album owner can share' }, { status: 403 });
    }

    const {
      linkType, // 'public' or 'private'
      password, // Required for private links
      expiresAt,
    } = body;

    // Validate linkType
    if (!['public', 'private'].includes(linkType)) {
      return NextResponse.json({ error: 'Invalid link type. Must be "public" or "private"' }, { status: 400 });
    }

    // Validate password for private links
    if (linkType === 'private' && !password) {
      return NextResponse.json({ error: 'Password is required for private links' }, { status: 400 });
    }

    const shares = [];

    if (linkType === 'public') {
      // PUBLIC LINK: Anonymous access, view/download/like only (no selection)

      // Check if a public link already exists for this album
      const existingPublicShare = await AlbumShare.findOne({
        albumId: id,
        shareType: 'link',
        linkType: 'public',
        isActive: true,
      });

      let share;
      if (existingPublicShare) {
        // Return existing public share
        share = existingPublicShare;
      } else {
        // Create new public share
        const accessToken = crypto.randomBytes(32).toString('hex');

        share = await AlbumShare.create({
          albumId: id,
          photographerId: decoded.userId,
          sharedWith: {
            email: '',
            name: linkType === 'public' ? 'Public Link' : 'Private Link',
          },
          shareType: 'link',
          linkType: 'public',
          accessToken,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          permissions: {
            canView: true,
            canDownload: true,
            canFavorite: true,
            canComment: false,
            canSelect: false, // Public links cannot select photos
          },
          isActive: true,
        });
      }

      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shared/${share.accessToken}`;

      shares.push({
        ...share.toObject(),
        shareUrl,
      });
    } else if (linkType === 'private') {
      // PRIVATE LINK: Password-protected with photo selection capability

      // Check if a private link already exists for this album
      const existingPrivateShare = await AlbumShare.findOne({
        albumId: id,
        shareType: 'link',
        linkType: 'private',
        isActive: true,
      });

      let share;
      if (existingPrivateShare) {
        // Update existing private share password
        const hashedPassword = await bcrypt.hash(password, 10);
        existingPrivateShare.password = hashedPassword;
        existingPrivateShare.expiresAt = expiresAt ? new Date(expiresAt) : existingPrivateShare.expiresAt;
        share = await existingPrivateShare.save();
      } else {
        // Create new private share
        const accessToken = crypto.randomBytes(32).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);

        share = await AlbumShare.create({
          albumId: id,
          photographerId: decoded.userId,
          sharedWith: {
            email: '',
            name: 'Private Link',
          },
          shareType: 'link',
          linkType: 'private',
          accessToken,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          permissions: {
            canView: true,
            canDownload: true,
            canFavorite: true,
            canComment: true,
            canSelect: true, // Private links can select photos
          },
          password: hashedPassword,
          isActive: true,
        });
      }

      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shared/${share.accessToken}`;

      shares.push({
        ...share.toObject(),
        shareUrl,
      });
    }

    return NextResponse.json({
      message: linkType === 'public'
        ? 'Public share link generated successfully'
        : 'Private share link generated successfully',
      shares,
      linkType,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Share Album Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to share album'
    }, { status: 500 });
  }
}

// GET /api/albums/[id]/share - Get all shares for an album
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
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all active link shares for this album
    const shares = await AlbumShare.find({
      albumId: id,
      shareType: 'link',
      isActive: true,
    }).sort({ createdAt: -1 });

    // Add share URLs to each share
    const sharesWithUrls = shares.map(share => {
      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shared/${share.accessToken}`;
      return {
        ...share.toObject(),
        shareUrl,
        isExpired: share.expiresAt ? new Date() > share.expiresAt : false,
      };
    });

    // Separate public and private links
    const publicLink = sharesWithUrls.find(s => s.linkType === 'public') || null;
    const privateLink = sharesWithUrls.find(s => s.linkType === 'private') || null;

    return NextResponse.json({
      publicLink,
      privateLink,
      totalShares: sharesWithUrls.length,
    });
  } catch (error: any) {
    console.error('Get Shares Error:', error);
    return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 });
  }
}

// DELETE /api/albums/[id]/share?shareId=xxx - Revoke a specific share or all shares
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
    await connectDB();

    const { id } = await params;
    // Check album access
    const album = await Album.findById(id);
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const isOwner = album.photographerId.toString() === decoded.userId;
    if (!isOwner) {
      return NextResponse.json({ error: 'Only album owner can revoke shares' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');
    const revokeAll = searchParams.get('all') === 'true';

    if (revokeAll) {
      // Revoke all shares for this album
      const result = await AlbumShare.updateMany(
        { albumId: id, isActive: true },
        { isActive: false }
      );

      return NextResponse.json({
        message: 'All shares revoked successfully',
        revokedCount: result.modifiedCount,
      });
    } else if (shareId) {
      // Revoke specific share
      const share = await AlbumShare.findOne({
        _id: shareId,
        albumId: id,
      });

      if (!share) {
        return NextResponse.json({ error: 'Share not found' }, { status: 404 });
      }

      share.isActive = false;
      await share.save();

      return NextResponse.json({
        message: 'Share revoked successfully',
        share,
      });
    } else {
      return NextResponse.json({
        error: 'Provide shareId or set all=true to revoke all shares'
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Revoke Share Error:', error);
    return NextResponse.json({ error: 'Failed to revoke share' }, { status: 500 });
  }
}

// PATCH /api/albums/[id]/share - Update share settings
export async function PATCH(
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
      return NextResponse.json({ error: 'Only album owner can update shares' }, { status: 403 });
    }

    const { shareId, permissions, expiresAt, password } = body;

    if (!shareId) {
      return NextResponse.json({ error: 'shareId is required' }, { status: 400 });
    }

    const share = await AlbumShare.findOne({
      _id: shareId,
      albumId: id,
    });

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    if (permissions) {
      share.permissions = { ...share.permissions, ...permissions };

      // Enforce security: Public links cannot have photo selection
      if (share.linkType === 'public') {
        share.permissions.canSelect = false;
      }
    }

    if (expiresAt !== undefined) {
      share.expiresAt = expiresAt ? new Date(expiresAt) : undefined;
    }

    if (password !== undefined) {
      share.password = password ? await bcrypt.hash(password, 10) : undefined;
    }

    await share.save();

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shared/${share.accessToken}`;

    return NextResponse.json({
      message: 'Share updated successfully',
      share: {
        ...share.toObject(),
        shareUrl,
      },
    });
  } catch (error: any) {
    console.error('Update Share Error:', error);
    return NextResponse.json({ error: 'Failed to update share' }, { status: 500 });
  }
}
