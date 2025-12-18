import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Person from '@/lib/models/Person';
import mongoose from 'mongoose';

// POST /api/person - Create a new person with initial embedding
export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();

        const { vectorId, vector, photographerId } = body;

        // Validate required fields
        if (!vectorId || !vector || !photographerId) {
            return NextResponse.json(
                { error: 'Missing required fields: vectorId, vector, photographerId' },
                { status: 400 }
            );
        }

        // Validate vector is an array
        if (!Array.isArray(vector)) {
            return NextResponse.json(
                { error: 'Vector must be an array of numbers' },
                { status: 400 }
            );
        }

        // Validate photographerId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(photographerId)) {
            return NextResponse.json(
                { error: 'Invalid photographerId' },
                { status: 400 }
            );
        }

        // Create new person with embedding
        const person = await Person.create({
            photographerId,
            isLabeled: false,
            photoCount: 0,
            embeddings: [
                {
                    vectorId,
                    vector,
                    createdAt: new Date(),
                },
            ],
        });

        return NextResponse.json(
            {
                success: true,
                personId: person._id.toString(),
                message: 'Person created successfully',
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Create Person Error:', error);
        return NextResponse.json(
            { error: 'Failed to create person', details: error.message },
            { status: 500 }
        );
    }
}
