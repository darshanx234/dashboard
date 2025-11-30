import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Client from '@/lib/models/Client';
import Event from '@/lib/models/Event';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/clients/[id]/events/[eventId] - Link event to client
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; eventId: string }> }
) {
    try {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        await connectDB();
        const { id, eventId } = await params;

        // Verify the event exists and belongs to the photographer
        const event = await Event.findOne({
            _id: eventId,
            photographerId: decoded.userId,
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Add event to client's eventIds
        const client = await Client.findOneAndUpdate(
            { _id: id, photographerId: decoded.userId },
            { $addToSet: { eventIds: eventId } },
            { new: true }
        ).lean();

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Update the event's clientId
        await Event.findByIdAndUpdate(eventId, { clientId: id });

        return NextResponse.json(client);
    } catch (error) {
        console.error('Error linking event:', error);
        return NextResponse.json(
            { error: 'Failed to link event' },
            { status: 500 }
        );
    }
}

// DELETE /api/clients/[id]/events/[eventId] - Unlink event from client
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; eventId: string }> }
) {
    try {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        await connectDB();
        const { id, eventId } = await params;

        // Remove event from client's eventIds
        const client = await Client.findOneAndUpdate(
            { _id: id, photographerId: decoded.userId },
            { $pull: { eventIds: eventId } },
            { new: true }
        ).lean();

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        return NextResponse.json(client);
    } catch (error) {
        console.error('Error unlinking event:', error);
        return NextResponse.json(
            { error: 'Failed to unlink event' },
            { status: 500 }
        );
    }
}
