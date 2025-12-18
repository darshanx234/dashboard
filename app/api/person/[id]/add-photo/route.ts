import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Person from '@/lib/models/Person';
import mongoose from 'mongoose';

// PUT /api/person/[id]/add-photo - Link photo to person
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();

        const { photoId } = body;

        // Validate required fields
        if (!photoId) {
            return NextResponse.json(
                { error: 'Missing required field: photoId' },
                { status: 400 }
            );
        }

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'Invalid person ID' },
                { status: 400 }
            );
        }

        if (!mongoose.Types.ObjectId.isValid(photoId)) {
            return NextResponse.json(
                { error: 'Invalid photo ID' },
                { status: 400 }
            );
        }

        // Find person and update
        const person = await Person.findById(id);

        if (!person) {
            return NextResponse.json(
                { error: 'Person not found' },
                { status: 404 }
            );
        }

        // Increment photo count
        person.photoCount += 1;

        // Set representative photo if not already set
        if (!person.representativePhotoId) {
            person.representativePhotoId = new mongoose.Types.ObjectId(photoId);
        }

        await person.save();

        return NextResponse.json(
            {
                success: true,
                message: 'Photo linked to person successfully',
                photoCount: person.photoCount,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Add Photo to Person Error:', error);
        return NextResponse.json(
            { error: 'Failed to link photo to person', details: error.message },
            { status: 500 }
        );
    }
}
