import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Client from '@/lib/models/Client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/clients - Get all clients for the photographer
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        await connectDB();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '50');
        const page = parseInt(searchParams.get('page') || '1');

        // Build query
        const query: any = { photographerId: decoded.userId };

        // Add search filter
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        // Get total count
        const total = await Client.countDocuments(query);

        // Get paginated clients
        const clients = await Client.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .lean();

        return NextResponse.json({
            clients,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json(
            { error: 'Failed to fetch clients' },
            { status: 500 }
        );
    }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const body = await request.json();

        await connectDB();

        const { firstName, lastName, email, phone, address, notes } = body;

        // Validate required fields
        if (!firstName || !lastName || !email) {
            return NextResponse.json(
                { error: 'First name, last name, and email are required' },
                { status: 400 }
            );
        }

        // Check if client with email already exists for this photographer
        const existingClient = await Client.findOne({
            photographerId: decoded.userId,
            email,
        });

        if (existingClient) {
            return NextResponse.json(
                { error: 'Client with this email already exists' },
                { status: 400 }
            );
        }

        // Create new client
        const client = await Client.create({
            photographerId: decoded.userId,
            firstName,
            lastName,
            email,
            phone,
            address,
            notes,
            albumIds: [],
        });

        return NextResponse.json(client, { status: 201 });
    } catch (error) {
        console.error('Error creating client:', error);
        return NextResponse.json(
            { error: 'Failed to create client' },
            { status: 500 }
        );
    }
}
