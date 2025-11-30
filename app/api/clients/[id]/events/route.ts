import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Client from '@/lib/models/Client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/clients/[id]/events - Get all events for a client
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

        // Import Event model dynamically to avoid circular dependencies
        const Event = (await import('@/lib/models/Event')).default;

        // Get all events for this client
        const events = await Event.find({
            _id: { $in: client.eventIds || [] },
            photographerId: decoded.userId,
        })
            .sort({ startDate: -1 })
            .lean();

        return NextResponse.json({ events });
    } catch (error) {
        console.error('Error fetching client events:', error);
        return NextResponse.json(
            { error: 'Failed to fetch events' },
            { status: 500 }
        );
    }
}
