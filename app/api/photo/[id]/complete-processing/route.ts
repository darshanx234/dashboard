import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Photo from '@/lib/models/Photo';
import PhotoPerson from '@/lib/models/PhotoPerson';
import mongoose from 'mongoose';

// PUT /api/photo/[id]/complete-processing - Mark photo as face detection processed
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();

        // Validate photo ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'Invalid photo ID' },
                { status: 400 }
            );
        }

        // Find photo and update
        const photo = await Photo.findById(id);

        if (!photo) {
            return NextResponse.json(
                { error: 'Photo not found' },
                { status: 404 }
            );
        }

        // Extract data from request
        const { photographerId, photoPersons } = body;
        console.log(photoPersons);
        console.log(photographerId);

        // Create PhotoPerson records if provided
        if (photoPersons && Array.isArray(photoPersons) && photoPersons.length > 0) {
            const photoPersonRecords = photoPersons.map((pp: any) => ({
                photoId: id,
                personId: pp.personId,
                photographerId: photographerId || photo.photographerId,
                boundingBox: {
                    x: 0.5,
                    y: 0.5,
                    width: 1,
                    height: 1,
                },
                confidence: 1,
            }));

            console.log(photoPersonRecords);

            // Bulk insert PhotoPerson records (using insertMany for better performance)
            try {
                const result = await PhotoPerson.insertMany(photoPersonRecords, { ordered: false });
                console.log(`✅ Created ${photoPersonRecords.length} PhotoPerson records for photo ${id}`);
                console.log(result);
                let resultget = await PhotoPerson.find({ photoId: id });
                console.log(resultget);

            } catch (error: any) {
                // Handle duplicate key errors gracefully (person already linked to photo)
                if (error.code === 11000) {
                    console.warn(`⚠️ Some PhotoPerson records already exist for photo ${id}`);
                } else {
                    console.error(`❌ Error creating PhotoPerson records for photo ${id}:`, error);
                }
            }

            // Update photo with persons count
            photo.personsCount = photoPersons.length;
        } else if (typeof body.personsCount === 'number') {
            // Fallback: Update persons count if provided directly
            photo.personsCount = body.personsCount;
        }

        // Update face detection status
        photo.isFaceDetectionProcessed = true;

        await photo.save();

        return NextResponse.json(
            {
                success: true,
                message: 'Photo processing completed',
                photoId: photo._id.toString(),
                personsCount: photo.personsCount,
                photoPersonsCreated: photoPersons?.length || 0,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Complete Photo Processing Error:', error);
        return NextResponse.json(
            { error: 'Failed to complete photo processing', details: error.message },
            { status: 500 }
        );
    }
}
