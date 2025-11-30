import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import AlbumShare from '@/lib/models/AlbumShare';
import AlbumShareClient from '@/lib/models/AlbumShareClient';
import Photo from '@/lib/models/Photo';
import AlbumShareInteraction from '@/lib/models/AlbumShareInteraction';

// POST - Add comment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        await connectDB();
        const { token } = await params;
        const body = await request.json();
        const { clientId, photoId, comment } = body;

        // Validate input
        if (!photoId || !comment || typeof comment !== 'string' || comment.trim().length === 0) {
            return NextResponse.json(
                { error: 'Photo ID and comment are required' },
                { status: 400 }
            );
        }

        // Find the share by token
        const share = await AlbumShare.findOne({
            accessToken: token,
            isActive: true,
        });

        if (!share) {
            return NextResponse.json(
                { error: 'Invalid or expired share link' },
                { status: 404 }
            );
        }

        // Check if comments are allowed
        if (!share.permissions.canComment) {
            return NextResponse.json(
                { error: 'Comments are not enabled for this album' },
                { status: 403 }
            );
        }

        // Find the photo
        const photo = await Photo.findOne({
            _id: photoId,
            albumId: share.albumId,
        });

        if (!photo) {
            return NextResponse.json(
                { error: 'Photo not found' },
                { status: 404 }
            );
        }

        // Get IP address and user agent
        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Track comment interaction
        const interaction = await AlbumShareInteraction.create({
            shareId: share._id,
            albumId: share.albumId,
            photographerId: share.photographerId,
            clientId: clientId || undefined,
            event: 'comment_add',
            photoId: photo._id,
            comment: comment.trim(),
            ipAddress,
            userAgent,
        });

        // Update client stats
        if (clientId) {
            await AlbumShareClient.findByIdAndUpdate(
                clientId,
                { $inc: { 'stats.comments': 1 } }
            );
        }

        // Populate client info for response
        await interaction.populate('clientId', 'name email');

        return NextResponse.json({
            success: true,
            comment: {
                _id: interaction._id,
                comment: interaction.comment,
                clientName: (interaction.clientId as any)?.name || 'Anonymous',
                createdAt: interaction.createdAt,
            },
        });
    } catch (error: any) {
        console.error('Add comment error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to add comment' },
            { status: 500 }
        );
    }
}

// GET - Get comments
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        await connectDB();
        const { token } = await params;
        const { searchParams } = new URL(request.url);
        const photoId = searchParams.get('photoId');

        // Find the share by token
        const share = await AlbumShare.findOne({
            accessToken: token,
            isActive: true,
        });

        if (!share) {
            return NextResponse.json(
                { error: 'Invalid or expired share link' },
                { status: 404 }
            );
        }

        // Build query
        const query: any = {
            shareId: share._id,
            event: 'comment_add',
        };

        if (photoId) {
            query.photoId = photoId;
        }

        // Get comments
        const comments = await AlbumShareInteraction.find(query)
            .populate('clientId', 'name email')
            .populate('photoId', 'originalName')
            .sort({ createdAt: -1 })
            .lean();

        // Format comments
        const formattedComments = comments.map((c: any) => ({
            _id: c._id,
            comment: c.comment,
            photoId: c.photoId?._id,
            photoName: c.photoId?.originalName,
            clientName: c.clientId?.name || 'Anonymous',
            clientEmail: c.clientId?.email,
            createdAt: c.createdAt,
        }));

        return NextResponse.json({
            comments: formattedComments,
            total: formattedComments.length,
        });
    } catch (error: any) {
        console.error('Get comments error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get comments' },
            { status: 500 }
        );
    }
}
