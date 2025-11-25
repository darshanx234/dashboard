import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Event from '@/lib/models/Event';
import Client from '@/lib/models/Client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/events - Get all events for the photographer
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        await connectDB();

        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const type = searchParams.get('type');
        const status = searchParams.get('status');

        // Build query
        const query: any = { photographerId: decoded.userId };

        if (clientId) {
            query.clientId = clientId;
        }

        if (startDate || endDate) {
            query.startDate = {};
            if (startDate) {
                query.startDate.$gte = new Date(startDate);
            }
            if (endDate) {
                query.startDate.$lte = new Date(endDate);
            }
        }

        if (type) {
            query.type = type;
        }

        if (status) {
            query.status = status;
        }

        // Get events
        const events = await Event.find(query)
            .sort({ startDate: 1 })
            .lean();

        return NextResponse.json({
            events,
            total: events.length,
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.json(
            { error: 'Failed to fetch events' },
            { status: 500 }
        );
    }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        await connectDB();

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

        // Validate required fields
        if (!clientId || !title || !type || !startDate || !endDate) {
            return NextResponse.json(
                { error: 'Client, title, type, start date, and end date are required' },
                { status: 400 }
            );
        }

        // Create new event
        const event = await Event.create({
            photographerId: decoded.userId,
            clientId,
            albumId,
            title,
            description,
            type,
            status: status || 'scheduled',
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            location,
            notes,
        });

        // Update client's eventIds array
        await Client.findOneAndUpdate(
            { _id: clientId, photographerId: decoded.userId },
            { $addToSet: { eventIds: event._id.toString() } }
        );

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error('Error creating event:', error);
        return NextResponse.json(
            { error: 'Failed to create event' },
            { status: 500 }
        );
    }
}
