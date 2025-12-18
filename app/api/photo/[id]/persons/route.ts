import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PhotoPerson from '@/lib/models/PhotoPerson';
import Person from '@/lib/models/Person';
import { generatePresignedDownloadUrl } from '@/lib/utils/s3';
import mongoose from 'mongoose';

// GET /api/photo/[id]/persons - Get all persons detected in a photo
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        // Explicitly ensure Person model is registered
        // This is needed for the populate() to work correctly
        const PersonModel = Person;

        // Validate photo ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'Invalid photo ID' },
                { status: 400 }
            );
        }

        // Find all PhotoPerson records for this photo
        // Use manual population if automatic populate fails
        let photoPersons;
        try {
            photoPersons = await PhotoPerson.find({ photoId: id })
                .populate('personId')
                .lean();
        } catch (populateError: any) {
            console.warn('Populate failed, using manual lookup:', populateError.message);
            // Fallback: manual population
            const photoPersonDocs = await PhotoPerson.find({ photoId: id }).lean();
            const personIds = photoPersonDocs.map(pp => pp.personId).filter(Boolean);
            const persons = await Person.find({ _id: { $in: personIds } }).lean();

            // Map persons to photoPersons
            const personsMap = new Map(persons.map(p => [p._id.toString(), p]));
            photoPersons = photoPersonDocs.map(pp => ({
                ...pp,
                personId: personsMap.get(pp.personId.toString())
            }));
        }

        // Generate presigned URLs for thumbnails
        const personsWithThumbnails = await Promise.all(
            photoPersons.map(async (pp: any) => {
                let thumbnailUrl = null;

                if (pp.personId?.thumbnailS3Key) {
                    try {
                        thumbnailUrl = await generatePresignedDownloadUrl(
                            pp.personId.thumbnailS3Key,
                            3600 // 1 hour expiry
                        );
                    } catch (error) {
                        console.error(`Failed to generate thumbnail URL for person ${pp.personId._id}:`, error);
                    }
                }

                return {
                    id: pp._id,
                    personId: pp.personId?._id,
                    name: pp.personId?.name,
                    isLabeled: pp.personId?.isLabeled || false,
                    boundingBox: pp.boundingBox,
                    confidence: pp.confidence,
                    thumbnailUrl,
                };
            })
        );

        return NextResponse.json(
            {
                success: true,
                persons: personsWithThumbnails,
                count: personsWithThumbnails.length,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get Photo Persons Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch photo persons', details: error.message },
            { status: 500 }
        );
    }
}
