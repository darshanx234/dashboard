import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Person from '@/lib/models/Person';
import { generatePresignedDownloadUrl } from '@/lib/utils/s3';
import mongoose from 'mongoose';

// GET /api/person/[id]/thumbnail - Get presigned URL for thumbnail download
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        // Validate person ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'Invalid person ID' },
                { status: 400 }
            );
        }

        // Find person
        const person = await Person.findById(id);

        if (!person) {
            return NextResponse.json(
                { error: 'Person not found' },
                { status: 404 }
            );
        }

        // Check if thumbnail exists
        if (!person.thumbnailS3Key) {
            return NextResponse.json(
                { error: 'No thumbnail available for this person' },
                { status: 404 }
            );
        }

        // Generate presigned download URL (1 hour expiry)
        const downloadUrl = await generatePresignedDownloadUrl(person.thumbnailS3Key, 3600);

        return NextResponse.json(
            {
                success: true,
                thumbnailUrl: downloadUrl,
                personId: person._id,
                name: person.name,
                isLabeled: person.isLabeled,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get Thumbnail Error:', error);
        return NextResponse.json(
            { error: 'Failed to get thumbnail URL', details: error.message },
            { status: 500 }
        );
    }
}
