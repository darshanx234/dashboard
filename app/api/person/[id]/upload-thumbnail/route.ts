import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Person from '@/lib/models/Person';
import { generatePresignedUploadUrl } from '@/lib/utils/s3';
import mongoose from 'mongoose';

// POST /api/person/[id]/upload-thumbnail - Get presigned URL for thumbnail upload
export async function POST(
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

        // Generate S3 key for thumbnail
        const timestamp = Date.now();
        const s3Key = `person-thumbnails/${person.photographerId}/${id}_${timestamp}.jpg`;

        // Generate presigned upload URL (15 minutes expiry)
        const uploadUrl = await generatePresignedUploadUrl(s3Key, 'image/jpeg', 900);

        // Generate public S3 URL
        const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

        return NextResponse.json(
            {
                success: true,
                uploadUrl,
                s3Key,
                s3Url,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Upload Thumbnail Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate upload URL', details: error.message },
            { status: 500 }
        );
    }
}

// PUT /api/person/[id]/upload-thumbnail - Update person with thumbnail info
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();

        const { s3Key, s3Url } = body;

        // Validate required fields
        if (!s3Key || !s3Url) {
            return NextResponse.json(
                { error: 'Missing required fields: s3Key, s3Url' },
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

        // Update person with thumbnail info
        const person = await Person.findByIdAndUpdate(
            id,
            {
                thumbnailS3Key: s3Key,
                thumbnailUrl: s3Url,
            },
            { new: true }
        );

        if (!person) {
            return NextResponse.json(
                { error: 'Person not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Thumbnail updated successfully',
                person: {
                    id: person._id,
                    thumbnailS3Key: person.thumbnailS3Key,
                    thumbnailUrl: person.thumbnailUrl,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Update Thumbnail Error:', error);
        return NextResponse.json(
            { error: 'Failed to update thumbnail', details: error.message },
            { status: 500 }
        );
    }
}
