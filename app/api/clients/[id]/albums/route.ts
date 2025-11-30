import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Client from '@/lib/models/Client';
import Album from '@/lib/models/Album';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/clients/[id]/albums - Get all albums for a client
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

        const client = await Client.findOne({
            _id: id,
            photographerId: decoded.userId,
        }).lean();

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Get all albums for this client
        const albums = await Album.find({
            _id: { $in: client.albumIds || [] },
            photographerId: decoded.userId,
        })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ albums });
    } catch (error) {
        console.error('Error fetching client albums:', error);
        return NextResponse.json(
            { error: 'Failed to fetch albums' },
            { status: 500 }
        );
    }
}
