import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Client from '@/lib/models/Client';
import Album from '@/lib/models/Album';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/clients/[id]/albums/[albumId] - Link album to client
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; albumId: string }> }
) {
    try {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        await connectDB();
        const { id, albumId } = await params;

        const client = await Client.findOneAndUpdate(
            { _id: id, photographerId: decoded.userId },
            { $addToSet: { albumIds: albumId } },
            { new: true }
        ).lean();

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Also update the Album to set clientId
        await Album.findByIdAndUpdate(albumId, { clientId: id });

        return NextResponse.json(client);
    } catch (error) {
        console.error('Error linking album:', error);
        return NextResponse.json(
            { error: 'Failed to link album' },
            { status: 500 }
        );
    }
}

// DELETE /api/clients/[id]/albums/[albumId] - Unlink album from client
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; albumId: string }> }
) {
    try {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        await connectDB();
        const { id, albumId } = await params;

        const client = await Client.findOneAndUpdate(
            { _id: id, photographerId: decoded.userId },
            { $pull: { albumIds: albumId } },
            { new: true }
        ).lean();

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Also clear the Album's clientId
        await Album.findByIdAndUpdate(albumId, { $unset: { clientId: 1 } });

        return NextResponse.json(client);
    } catch (error) {
        console.error('Error unlinking album:', error);
        return NextResponse.json(
            { error: 'Failed to unlink album' },
            { status: 500 }
        );
    }
}
