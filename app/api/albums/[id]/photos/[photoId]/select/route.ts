
import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import Album from '@/lib/models/Album';
import Photo from '@/lib/models/Photo';
import { verifyToken } from '@/lib/auth/jwt';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; photoId: string }> }
) {
    try {
        await connectToDB();

        const { id: albumId, photoId } = await params;

        // 1. Authenticate user
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
        }

        const photographerId = decoded.userId;

        // 2. Verify album ownership
        const album = await Album.findOne({ _id: albumId, photographerId });
        if (!album) {
            return NextResponse.json({ message: 'Album not found or access denied' }, { status: 404 });
        }

        // 3. Update photo
        const body = await req.json();
        const { isClientSelected } = body;

        if (typeof isClientSelected !== 'boolean') {
            return NextResponse.json({ message: 'isClientSelected is required' }, { status: 400 });
        }

        const photo = await Photo.findOneAndUpdate(
            { _id: photoId, albumId },
            { isClientSelected },
            { new: true }
        );

        if (!photo) {
            return NextResponse.json({ message: 'Photo not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: `Photo ${isClientSelected ? 'selected' : 'deselected'} successfully`,
            photo
        });

    } catch (error: any) {
        console.error('Admin photo selection error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
