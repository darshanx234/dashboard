import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import AlbumShare from '@/lib/models/AlbumShare';
import AlbumShareClient from '@/lib/models/AlbumShareClient';
import Photo from '@/lib/models/Photo';
import AlbumShareInteraction from '@/lib/models/AlbumShareInteraction';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        await connectDB();
        const { token } = await params;
        const body = await request.json();
        const { clientId, photoId, isFavorite } = body;

        // Validate input
        if (!photoId) {
            return NextResponse.json(
                { error: 'Photo ID is required' },
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

        // Check if favorites are allowed
        if (!share.permissions.canFavorite) {
            return NextResponse.json(
                { error: 'Favorites are not enabled for this album' },
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

        // Check if this client already has a favorite interaction for this photo
        const existingFavorite = await AlbumShareInteraction.findOne({
            clientId: clientId || undefined,
            photoId: photo._id,
            event: { $in: ['photo_favorite', 'photo_unfavorite'] },
        }).sort({ createdAt: -1 }); // Get the most recent one

        // Determine current state
        const currentlyFavorited = existingFavorite?.event === 'photo_favorite';

        // Determine the event based on isFavorite
        const event = isFavorite ? 'photo_favorite' : 'photo_unfavorite';

        // Only update if the state is actually changing
        if (currentlyFavorited !== isFavorite) {
            // Update photo favorites count
            if (isFavorite) {
                photo.favoritesCount = (photo.favoritesCount || 0) + 1;
            } else {
                photo.favoritesCount = Math.max((photo.favoritesCount || 0) - 1, 0);
            }
            await photo.save();

            // Track interaction
            await AlbumShareInteraction.create({
                shareId: share._id,
                albumId: share.albumId,
                photographerId: share.photographerId,
                clientId: clientId || undefined,
                event,
                photoId: photo._id,
                ipAddress,
                userAgent,
            });

            // Update client stats
            if (clientId) {
                const statsUpdate = isFavorite
                    ? { $inc: { 'stats.favorites': 1 } }
                    : { $inc: { 'stats.favorites': -1 } };

                await AlbumShareClient.findByIdAndUpdate(
                    clientId,
                    statsUpdate
                );
            }
        }

        return NextResponse.json({
            success: true,
            isFavorite,
            favoritesCount: photo.favoritesCount,
            wasAlreadyInState: currentlyFavorited === isFavorite,
        });
    } catch (error: any) {
        console.error('Toggle favorite error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to toggle favorite' },
            { status: 500 }
        );
    }
}
