import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Event from '@/lib/models/Event';
import Client from '@/lib/models/Client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/events/[id] - Get a single event
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

        const event = await Event.findOne({
            _id: id,
            photographerId: decoded.userId,
        }).lean();

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        return NextResponse.json(
            { error: 'Failed to fetch event' },
            { status: 500 }
        );
    }
}

// PUT /api/events/[id] - Update an event
export async function PUT(
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
        const body = await request.json();

        const {
            clientId,
            albumId,
            title,
            description,
            type,
            status,
            startDate,
            endDate,
            location,
            notes,
        } = body;

        // Build update object
        const updateData: any = {
            updatedAt: new Date(),
        };

        if (clientId !== undefined) updateData.clientId = clientId;
        if (albumId !== undefined) updateData.albumId = albumId;
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (type !== undefined) updateData.type = type;
        if (status !== undefined) updateData.status = status;
        if (startDate !== undefined) updateData.startDate = new Date(startDate);
        if (endDate !== undefined) updateData.endDate = new Date(endDate);
        if (location !== undefined) updateData.location = location;
        if (notes !== undefined) updateData.notes = notes;

        // Get the old event to check if clientId changed
        const oldEvent = await Event.findOne({
            _id: id,
            photographerId: decoded.userId,
        }).lean();

        if (!oldEvent) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Find and update event
        const event = await Event.findOneAndUpdate(
            { _id: id, photographerId: decoded.userId },
            { $set: updateData },
            { new: true, runValidators: true }
        ).lean();

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Handle client change
        if (clientId !== undefined && oldEvent.clientId !== clientId) {
            // Remove from old client
            if (oldEvent.clientId) {
                await Client.findOneAndUpdate(
                    { _id: oldEvent.clientId, photographerId: decoded.userId },
                    { $pull: { eventIds: id } }
                );
            }
            // Add to new client
            if (clientId) {
                await Client.findOneAndUpdate(
                    { _id: clientId, photographerId: decoded.userId },
                    { $addToSet: { eventIds: id } }
                );
            }
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error('Error updating event:', error);
        return NextResponse.json(
            { error: 'Failed to update event' },
            { status: 500 }
        );
    }
}

// DELETE /api/events/[id] - Delete an event
export async function DELETE(
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

        const event = await Event.findOneAndDelete({
            _id: id,
            photographerId: decoded.userId,
        }).lean();

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Remove event from client's eventIds
        if (event.clientId) {
            await Client.findOneAndUpdate(
                { _id: event.clientId, photographerId: decoded.userId },
                { $pull: { eventIds: id } }
            );
        }

        return NextResponse.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        return NextResponse.json(
            { error: 'Failed to delete event' },
            { status: 500 }
        );
    }
}
