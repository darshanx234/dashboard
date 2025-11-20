import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Album from '@/lib/models/Album';
import AlbumShare from '@/lib/models/AlbumShare';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/albums/[id]/share - Share album with users or generate public link
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
      shareType, // 'link' (public) or 'email' (private - selected users)
      emails, // Array of {email, name} for private sharing
      permissions,
      expiresAt,
      password, // Optional password for link-based sharing
      message, // Optional message to include in email
    } = body;

    // Validate shareType
    if (!['link', 'email'].includes(shareType)) {
      return NextResponse.json({ error: 'Invalid share type. Must be "link" or "email"' }, { status: 400 });
    }

    const shares = [];

    if (shareType === 'link') {
      // PUBLIC SHARING: Generate public link accessible by anyone with the token

      // Check if a public link already exists for this album
      const existingPublicShare = await AlbumShare.findOne({
        albumId: id,
        shareType: 'link',
        'sharedWith.email': 'public',
        isActive: true,
      });

      let share;
      if (existingPublicShare) {
        // Update existing public share
        const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

        existingPublicShare.permissions = permissions || existingPublicShare.permissions;
        existingPublicShare.expiresAt = expiresAt ? new Date(expiresAt) : existingPublicShare.expiresAt;
        existingPublicShare.password = hashedPassword || existingPublicShare.password;

        share = await existingPublicShare.save();
      } else {
        // Create new public share
        const accessToken = crypto.randomBytes(32).toString('hex');
        const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

        share = await AlbumShare.create({
          albumId: id,
          photographerId: decoded.userId,
          sharedWith: {
            email: 'public',
            name: 'Public Link',
          },
          shareType: 'link',
          accessToken,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          permissions: permissions || {
            canView: true,
            canDownload: true,
            canFavorite: true,
            canComment: false,
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
    } else if (shareType === 'email') {
      // PRIVATE SHARING: Share with specific users via email

      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return NextResponse.json({ error: 'Emails are required for private sharing' }, { status: 400 });
      }

      // Validate emails
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const emailData of emails) {
        if (!emailData.email || !emailRegex.test(emailData.email)) {
          return NextResponse.json({ error: `Invalid email: ${emailData.email}` }, { status: 400 });
        }
      }

      // Create shares for each email
      for (const emailData of emails) {
        // Check if already shared with this email
        const existingShare = await AlbumShare.findOne({
          albumId: id,
          shareType: 'email',
          'sharedWith.email': emailData.email.toLowerCase(),
          isActive: true,
        });

        let share;
        if (existingShare) {
          // Update existing share
          existingShare.permissions = permissions || existingShare.permissions;
          existingShare.expiresAt = expiresAt ? new Date(expiresAt) : existingShare.expiresAt;
          existingShare.sharedWith.name = emailData.name || existingShare.sharedWith.name;

          share = await existingShare.save();
        } else {
          // Create new share
          const accessToken = crypto.randomBytes(32).toString('hex');

          share = await AlbumShare.create({
            albumId: id,
            photographerId: decoded.userId,
            sharedWith: {
              email: emailData.email.toLowerCase(),
              name: emailData.name || '',
            },
            shareType: 'email',
            accessToken,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            permissions: permissions || {
              canView: true,
              canDownload: true,
              canFavorite: true,
              canComment: false,
            },
            isActive: true,
          });
        }

        const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shared/${share.accessToken}`;

        shares.push({
          ...share.toObject(),
          shareUrl,
        });

        // TODO: Send email notification with access link
        // sendShareNotification(emailData.email, {
        //   albumTitle: album.title,
        //   shareUrl,
        //   message,
        //   photographerName: album.photographerName,
        // });
      }
    }

    return NextResponse.json({
      message: shareType === 'link'
        ? 'Public share link generated successfully'
        : `Album shared with ${shares.length} user(s) successfully`,
      shares,
      shareType,
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

    // Get all active shares for this album
    const shares = await AlbumShare.find({
      albumId: id,
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

    // Separate public and private shares
    const publicShare = sharesWithUrls.find(s => s.shareType === 'link');
    const privateShares = sharesWithUrls.filter(s => s.shareType === 'email');

    return NextResponse.json({
      shares: sharesWithUrls,
      publicShare,
      privateShares,
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

    // Update fields
    if (permissions) {
      share.permissions = { ...share.permissions, ...permissions };
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
