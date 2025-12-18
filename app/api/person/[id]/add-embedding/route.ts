import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Person from '@/lib/models/Person';
import mongoose from 'mongoose';

// PUT /api/person/[id]/add-embedding - Add embedding to existing person
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();

        const { vectorId, vector } = body;

        // Validate required fields
        if (!vectorId || !vector) {
            return NextResponse.json(
                { error: 'Missing required fields: vectorId, vector' },
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

        // Validate person ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'Invalid person ID' },
                { status: 400 }
            );
        }

        // Find person and add embedding
        const person = await Person.findById(id);

        if (!person) {
            return NextResponse.json(
                { error: 'Person not found' },
                { status: 404 }
            );
        }

        // Add new embedding to embeddings array
        person.embeddings.push({
            vectorId,
            vector,
            createdAt: new Date(),
        });

        await person.save();

        return NextResponse.json(
            {
                success: true,
                message: 'Embedding added successfully',
                embeddingsCount: person.embeddings.length,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Add Embedding Error:', error);
        return NextResponse.json(
            { error: 'Failed to add embedding', details: error.message },
            { status: 500 }
        );
    }
}
