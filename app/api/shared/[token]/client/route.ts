import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import AlbumShare from '@/lib/models/AlbumShare';
import AlbumShareClient from '@/lib/models/AlbumShareClient';
import AlbumShareInteraction from '@/lib/models/AlbumShareInteraction';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        await connectDB();
        const { token } = await params;
        const body = await request.json();
        const { name, email, clientIdentifier } = body;

        // Validate input
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        if (!clientIdentifier || typeof clientIdentifier !== 'string') {
            return NextResponse.json(
                { error: 'Client identifier is required' },
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

        // Check if share has expired
        if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
            return NextResponse.json(
                { error: 'This share link has expired' },
                { status: 403 }
            );
        }

        // Get IP address and user agent
        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Upsert client record (update if exists, create if new)
        const client = await AlbumShareClient.findOneAndUpdate(
            {
                albumId: share.albumId,
                clientIdentifier: clientIdentifier.trim(),
            },
            {
                $set: {
                    shareId: share._id,
                    name: name.trim(),
                    email: email?.trim() || undefined,
                    ipAddress,
                    userAgent,
                    lastAccessedAt: new Date(),
                },
                $setOnInsert: {
                    stats: {
                        photoViews: 0,
                        favorites: 0,
                        comments: 0,
                        downloads: 0,
                    },
                },
            },
            {
                upsert: true,
                new: true,
                runValidators: true,
            }
        );

        // Track identity_entered interaction only for new clients
        const existingInteraction = await AlbumShareInteraction.findOne({
            clientId: client._id,
            event: 'identity_entered',
        });

        if (!existingInteraction) {
            await AlbumShareInteraction.create({
                shareId: share._id,
                albumId: share.albumId,
                photographerId: share.photographerId,
                clientId: client._id,
                event: 'identity_entered',
                ipAddress,
                userAgent,
            });
        }

        // Return client ID (will be stored in localStorage on client side)
        return NextResponse.json({
            success: true,
            clientId: client._id.toString(),
            message: 'Identity saved successfully',
            isReturningClient: !!existingInteraction,
        });
    } catch (error: any) {
        console.error('Save client identity error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to save identity' },
            { status: 500 }
        );
    }
}
