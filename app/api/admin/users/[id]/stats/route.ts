import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import Album from '@/lib/models/Album';
import Photo from '@/lib/models/Photo';
import Wallet from '@/lib/models/Wallet';
import Transaction from '@/lib/models/Transaction';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Helper to verify admin role
 */
async function verifyAdmin(request: NextRequest) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
        return { error: 'Unauthorized', status: 401 };
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        await connectToDatabase();
        const user = await User.findById(decoded.userId).select('role');

        if (!user || user.role !== 'admin') {
            return { error: 'Admin access required', status: 403 };
        }

        return { userId: decoded.userId, user };
    } catch (error) {
        return { error: 'Invalid token', status: 401 };
    }
}

/**
 * GET /api/admin/users/[id]/stats - Get user statistics and details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await verifyAdmin(request);
    if ('error' in authResult) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        const { id } = await params;

        // Get user details
        const user = await User.findById(id).select('-password').lean();
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get wallet info
        const wallet = await Wallet.findOne({ userId: id }).lean();

        // Get album statistics
        const albumStats = await Album.aggregate([
            { $match: { photographerId: user._id } },
            {
                $group: {
                    _id: null,
                    totalAlbums: { $sum: 1 },
                    totalPhotos: { $sum: '$totalPhotos' },
                    totalStorageUsed: { $sum: '$storageUsed' },
                    totalViews: { $sum: '$totalViews' },
                    totalDownloads: { $sum: '$totalDownloads' },
                    publishedAlbums: {
                        $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
                    },
                    draftAlbums: {
                        $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
                    },
                    archivedAlbums: {
                        $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] }
                    },
                }
            }
        ]);

        // Get photo statistics
        const photoStats = await Photo.aggregate([
            { $match: { photographerId: user._id } },
            {
                $group: {
                    _id: null,
                    totalPhotos: { $sum: 1 },
                    totalSize: { $sum: '$fileSize' },
                    totalViews: { $sum: '$views' },
                    totalDownloads: { $sum: '$downloads' },
                    totalFavorites: { $sum: '$favoritesCount' },
                    processedPhotos: {
                        $sum: { $cond: [{ $eq: ['$isProcessed', true] }, 1, 0] }
                    },
                }
            }
        ]);

        // Get recent albums
        const recentAlbums = await Album.find({ photographerId: id })
            .select('title status totalPhotos storageUsed createdAt')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // Get recent transactions
        const recentTransactions = await Transaction.find({ userId: id })
            .select('type amount category description createdAt')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Combine stats
        const stats = {
            albums: albumStats[0] || {
                totalAlbums: 0,
                totalPhotos: 0,
                totalStorageUsed: 0,
                totalViews: 0,
                totalDownloads: 0,
                publishedAlbums: 0,
                draftAlbums: 0,
                archivedAlbums: 0,
            },
            photos: photoStats[0] || {
                totalPhotos: 0,
                totalSize: 0,
                totalViews: 0,
                totalDownloads: 0,
                totalFavorites: 0,
                processedPhotos: 0,
            },
            wallet: {
                balance: wallet?.balance || 0,
                currency: wallet?.currency || 'CREDITS',
                isActive: wallet?.isActive ?? true,
            },
        };

        return NextResponse.json({
            user,
            stats,
            recentAlbums,
            recentTransactions,
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user stats' },
            { status: 500 }
        );
    }
}
