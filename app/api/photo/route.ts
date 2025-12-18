import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Photo from '@/lib/models/Photo';
import PhotoPerson from '@/lib/models/PhotoPerson';
import mongoose from 'mongoose';

// POST /api/photo - Create photo with detected faces
export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();

        const { uploadedBy, storageUri, detectedFaces, albumId } = body;

        // Validate required fields
        if (!uploadedBy || !storageUri) {
            return NextResponse.json(
                { error: 'Missing required fields: uploadedBy, storageUri' },
                { status: 400 }
            );
        }

        // Validate uploadedBy is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(uploadedBy)) {
            return NextResponse.json(
                { error: 'Invalid uploadedBy (photographerId)' },
                { status: 400 }
            );
        }

        // Validate albumId if provided
        if (albumId && !mongoose.Types.ObjectId.isValid(albumId)) {
            return NextResponse.json(
                { error: 'Invalid albumId' },
                { status: 400 }
            );
        }

        const faces = detectedFaces || [];

        // Create photo document
        const photo = await Photo.create({
            albumId: albumId || new mongoose.Types.ObjectId(), // Default album if not provided
            photographerId: uploadedBy,
            filename: storageUri.split('/').pop() || 'unknown',
            originalName: storageUri.split('/').pop() || 'unknown',
            s3Key: storageUri, // Using s3Key field to store MinIO URI
            s3Url: storageUri, // Using s3Url field to store MinIO URI
            fileSize: 0, // Will be updated later if needed
            mimeType: 'image/jpeg', // Default, can be passed in body
            personsCount: faces.length,
            isFaceDetectionProcessed: true,
            status: 'ready',
            order: 0,
        });

        // Create PhotoPerson junction records for each detected face
        const photoPersonRecords = [];

        for (const face of faces) {
            const { personId, bbox, confidence } = face;

            // Validate personId
            if (!mongoose.Types.ObjectId.isValid(personId)) {
                console.warn(`Invalid personId: ${personId}, skipping face`);
                continue;
            }

            // Validate bbox
            if (!bbox || typeof bbox.x !== 'number' || typeof bbox.y !== 'number' ||
                typeof bbox.width !== 'number' || typeof bbox.height !== 'number') {
                console.warn(`Invalid bbox for personId: ${personId}, skipping face`);
                continue;
            }

            try {
                const photoPerson = await PhotoPerson.create({
                    photoId: photo._id,
                    personId,
                    photographerId: uploadedBy,
                    boundingBox: {
                        x: bbox.x,
                        y: bbox.y,
                        width: bbox.width,
                        height: bbox.height,
                    },
                    confidence: confidence || 0.95,
                });

                photoPersonRecords.push(photoPerson);
            } catch (err: any) {
                console.error(`Failed to create PhotoPerson for personId ${personId}:`, err.message);
            }
        }

        return NextResponse.json(
            {
                success: true,
                photoId: photo._id.toString(),
                message: 'Photo created successfully',
                personsCount: photoPersonRecords.length,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Create Photo Error:', error);
        return NextResponse.json(
            { error: 'Failed to create photo', details: error.message },
            { status: 500 }
        );
    }
}
