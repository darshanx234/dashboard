import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Photo from '@/lib/models/Photo';
import mongoose from 'mongoose';
import {
    generatePresignedUploadUrlsForVariants,
    PhotoVariantType,
    getPublicUrl
} from '@/lib/utils/s3';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/photo/[id]/upload-variants - Generate presigned URLs for photo variants
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const { id } = await params;

        // Validate photo ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'Invalid photo ID' },
                { status: 400 }
            );
        }

        await connectDB();

        // Find the photo
        const photo = await Photo.findById(id);

        if (!photo) {
            return NextResponse.json(
                { error: 'Photo not found' },
                { status: 404 }
            );
        }

        // Check authorization - only the photographer can upload variants
        if (photo.photographerId.toString() !== decoded.userId) {
            return NextResponse.json(
                { error: 'Not authorized to upload variants for this photo' },
                { status: 403 }
            );
        }

        // Get requested variants from body, default to webp and thumbnail
        const body = await request.json().catch(() => ({}));
        const requestedVariants: PhotoVariantType[] = body.variants || ['webp', 'thumbnail'];

        // Validate variants
        const validVariants: PhotoVariantType[] = ['original', 'webp', 'thumbnail'];
        const variants = requestedVariants.filter(v => validVariants.includes(v));

        if (variants.length === 0) {
            return NextResponse.json(
                { error: 'No valid variants specified' },
                { status: 400 }
            );
        }

        // Generate presigned upload URLs for each variant
        const uploadUrls = await generatePresignedUploadUrlsForVariants(
            photo.photographerId.toString(),
            photo.albumId.toString(),
            photo.originalName,
            variants
        );

        return NextResponse.json({
            success: true,
            photoId: photo._id.toString(),
            uploadUrls,
            expiresIn: 300, // 5 minutes
        });
    } catch (error: any) {
        console.error('Generate Variant Upload URLs Error:', error);

        if (error.name === 'JsonWebTokenError') {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        return NextResponse.json(
            { error: 'Failed to generate variant upload URLs', details: error.message },
            { status: 500 }
        );
    }
}

// PUT /api/photo/[id]/upload-variants - Confirm variant uploads and update photo
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
        const { id } = await params;

        // Validate photo ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'Invalid photo ID' },
                { status: 400 }
            );
        }

        await connectDB();

        // Find the photo
        const photo = await Photo.findById(id);

        if (!photo) {
            return NextResponse.json(
                { error: 'Photo not found' },
                { status: 404 }
            );
        }

        // Check authorization
        if (photo.photographerId.toString() !== decoded.userId) {
            return NextResponse.json(
                { error: 'Not authorized to update variants for this photo' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { variants } = body;

        if (!variants || typeof variants !== 'object') {
            return NextResponse.json(
                { error: 'Variants data is required' },
                { status: 400 }
            );
        }

        // Initialize variants object if not exists
        if (!photo.variants) {
            photo.variants = {};
        }

        // Update each variant
        const validVariants: PhotoVariantType[] = ['original', 'webp', 'thumbnail'];
        const updatedVariants: string[] = [];

        for (const variant of validVariants) {
            if (variants[variant]) {
                const variantData = variants[variant];

                // Validate required fields
                if (!variantData.s3Key) {
                    continue;
                }

                photo.variants[variant] = {
                    s3Key: variantData.s3Key,
                    s3Url: variantData.s3Url || getPublicUrl(variantData.s3Key),
                    mimeType: variantData.mimeType || 'image/webp',
                    width: variantData.width,
                    height: variantData.height,
                    fileSize: variantData.fileSize,
                };

                updatedVariants.push(variant);

                // Update legacy thumbnailUrl for backwards compatibility
                if (variant === 'thumbnail') {
                    photo.thumbnailUrl = photo.variants[variant]?.s3Url;
                }
            }
        }

        await photo.save();

        return NextResponse.json({
            success: true,
            photoId: photo._id.toString(),
            updatedVariants,
            message: `Updated ${updatedVariants.length} variant(s)`,
        });
    } catch (error: any) {
        console.error('Update Photo Variants Error:', error);

        if (error.name === 'JsonWebTokenError') {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        return NextResponse.json(
            { error: 'Failed to update photo variants', details: error.message },
            { status: 500 }
        );
    }
}
