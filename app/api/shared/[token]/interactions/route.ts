import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AlbumShare from '@/lib/models/AlbumShare';
import AlbumShareInteraction from '@/lib/models/AlbumShareInteraction';
import { verifyToken } from '@/lib/jwt';

// POST - Track interaction
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        await connectDB();
        const { token } = await params;
        const body = await request.json();
        const { clientId, event, photoId, comment, meta } = body;

        // Validate event type
        const validEvents = [
            'album_open',
            'photo_view',
            'photo_select',
            'photo_unselect',
            'photo_favorite',
            'photo_unfavorite',
            'comment_add',
            'selection_submit',
        ];

        if (!event || !validEvents.includes(event)) {
            return NextResponse.json(
                { error: 'Invalid event type' },
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

        // Get IP address and user agent
        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Create interaction record
        const interaction = await AlbumShareInteraction.create({
            shareId: share._id,
            albumId: share.albumId,
            photographerId: share.photographerId,
            clientId: clientId || undefined,
            event,
            photoId: photoId || undefined,
            comment: comment || undefined,
            meta: meta || undefined,
            ipAddress,
            userAgent,
        });

        return NextResponse.json({
            success: true,
            interactionId: interaction._id.toString(),
        });
    } catch (error: any) {
        console.error('Track interaction error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to track interaction' },
            { status: 500 }
        );
    }
}

// GET - Get interactions (photographer only)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        await connectDB();
        const { token } = await params;

        // Verify photographer authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const jwtToken = authHeader.substring(7);
        const decoded = await verifyToken(jwtToken);

        if (!decoded || !decoded.userId) {
            return NextResponse.json(
                { error: 'Invalid authentication token' },
                { status: 401 }
            );
        }

        // Find the share by token
        const share = await AlbumShare.findOne({
            accessToken: token,
            photographerId: decoded.userId, // Ensure photographer owns this share
        });

        if (!share) {
            return NextResponse.json(
                { error: 'Share not found or unauthorized' },
                { status: 404 }
            );
        }

        // Get all interactions for this share
        const interactions = await AlbumShareInteraction.find({
            shareId: share._id,
        })
            .populate('clientId', 'name email')
            .populate('photoId', 'originalName thumbnailUrl')
            .sort({ createdAt: -1 })
            .lean();

        // Get unique clients
        const clients = await AlbumShareInteraction.aggregate([
            { $match: { shareId: share._id } },
            { $group: { _id: '$clientId' } },
            {
                $lookup: {
                    from: 'albumshareclients',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'client',
                },
            },
            { $unwind: '$client' },
            {
                $project: {
                    _id: '$client._id',
                    name: '$client.name',
                    email: '$client.email',
                    createdAt: '$client.createdAt',
                },
            },
        ]);

        // Get interaction summary by event type
        const eventSummary = await AlbumShareInteraction.aggregate([
            { $match: { shareId: share._id } },
            { $group: { _id: '$event', count: { $sum: 1 } } },
        ]);

        // Get photo-specific analytics
        const photoAnalytics = await AlbumShareInteraction.aggregate([
            {
                $match: {
                    shareId: share._id,
                    photoId: { $exists: true },
                }
            },
            {
                $group: {
                    _id: '$photoId',
                    views: {
                        $sum: { $cond: [{ $eq: ['$event', 'photo_view'] }, 1, 0] },
                    },
                    favorites: {
                        $sum: { $cond: [{ $eq: ['$event', 'photo_favorite'] }, 1, 0] },
                    },
                    comments: {
                        $sum: { $cond: [{ $eq: ['$event', 'comment_add'] }, 1, 0] },
                    },
                    selections: {
                        $sum: { $cond: [{ $eq: ['$event', 'photo_select'] }, 1, 0] },
                    },
                },
            },
        ]);

        return NextResponse.json({
            interactions,
            clients,
            eventSummary,
            photoAnalytics,
            totalInteractions: interactions.length,
        });
    } catch (error: any) {
        console.error('Get interactions error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get interactions' },
            { status: 500 }
        );
    }
}
