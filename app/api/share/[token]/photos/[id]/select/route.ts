
import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import AlbumShare from '@/lib/models/AlbumShare';
import Photo from '@/lib/models/Photo';
import mongoose from 'mongoose';

export async function POST(
    req: NextRequest,
    { params }: { params: { token: string; id: string } }
) {
    try {
        await connectToDB();

        const { token, id } = params;
        const photoId = id;

        const body = await req.json();
        const { isClientSelected } = body;

        if (typeof isClientSelected !== 'boolean') {
            return NextResponse.json(
                { message: 'isClientSelected boolean value is required' },
                { status: 400 }
            );
        }

        // 1. Verify Share Token
        const share = await AlbumShare.findOne({ accessToken: token });

        if (!share) {
            return NextResponse.json({ message: 'Invalid share token' }, { status: 401 });
        }

        if (share.expiresAt && share.expiresAt < new Date()) {
            return NextResponse.json({ message: 'Share link expired' }, { status: 410 });
        }

        if (!share.isActive) {
            return NextResponse.json({ message: 'Share link inactve' }, { status: 410 });
        }
        
        // 2. Update Photo
         const photo = await Photo.findOneAndUpdate(
            { _id: photoId, albumId: share.albumId },
            { isClientSelected: isClientSelected },
            { new: true }
        );

        if (!photo) {
             return NextResponse.json({ message: 'Photo not found or not in this album' }, { status: 404 });
        }
console.log(photo);
        return NextResponse.json(photo);

    } catch (error: any) {
        console.error('Toggle selection error:', error);
        return NextResponse.json(
            { message: error.message || 'Failed to update selection' },
            { status: 500 }
        );
    }
}
