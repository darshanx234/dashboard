import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Client from '@/lib/models/Client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/clients/[id] - Get a single client
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

        return NextResponse.json(client);
    } catch (error) {
        console.error('Error fetching client:', error);
        return NextResponse.json(
            { error: 'Failed to fetch client' },
            { status: 500 }
        );
    }
}

// PUT /api/clients/[id] - Update a client
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

        const { firstName, lastName, email, phone, address, notes } = body;

        // Find and update client
        const client = await Client.findOneAndUpdate(
            { _id: id, photographerId: decoded.userId },
            {
                $set: {
                    firstName,
                    lastName,
                    email,
                    phone,
                    address,
                    notes,
                    updatedAt: new Date(),
                },
            },
            { new: true, runValidators: true }
        ).lean();

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        return NextResponse.json(client);
    } catch (error) {
        console.error('Error updating client:', error);
        return NextResponse.json(
            { error: 'Failed to update client' },
            { status: 500 }
        );
    }
}

// DELETE /api/clients/[id] - Delete a client
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

        const client = await Client.findOneAndDelete({
            _id: id,
            photographerId: decoded.userId,
        });

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Error deleting client:', error);
        return NextResponse.json(
            { error: 'Failed to delete client' },
            { status: 500 }
        );
    }
}
