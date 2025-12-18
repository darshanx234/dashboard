import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPhotoPerson extends Document {
    photoId: mongoose.Types.ObjectId;
    personId: mongoose.Types.ObjectId;
    photographerId: mongoose.Types.ObjectId;
    boundingBox: {
        x: number; // Top-left x coordinate (0-1 normalized)
        y: number; // Top-left y coordinate (0-1 normalized)
        width: number; // Width (0-1 normalized)
        height: number; // Height (0-1 normalized)
    };
    confidence: number; // Face detection confidence score (0-1)
    faceEncoding?: number[]; // Face embedding vector for this specific detection
    createdAt: Date;
    updatedAt: Date;
}

const PhotoPersonSchema: Schema = new Schema(
    {
        photoId: {
            type: Schema.Types.ObjectId,
            ref: 'Photo',
            required: [true, 'Photo ID is required'],
            index: true,
        },
        personId: {
            type: Schema.Types.ObjectId,
            ref: 'Person',
            required: [true, 'Person ID is required'],
            index: true,
        },
        photographerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Photographer ID is required'],
            index: true,
        },
        boundingBox: {
            x: {
                type: Number,
                required: true,
                min: 0,
                max: 1,
            },
            y: {
                type: Number,
                required: true,
                min: 0,
                max: 1,
            },
            width: {
                type: Number,
                required: true,
                min: 0,
                max: 1,
            },
            height: {
                type: Number,
                required: true,
                min: 0,
                max: 1,
            },
        },
        confidence: {
            type: Number,
            required: true,
            min: 0,
            max: 1,
        },

    },
    {
        timestamps: true,
    }
);

// Composite index to prevent duplicate person-photo pairs and optimize queries
// PhotoPersonSchema.index({ photoId: 1, personId: 1 }, { unique: true });
// PhotoPersonSchema.index({ personId: 1, createdAt: -1 });
// PhotoPersonSchema.index({ photographerId: 1, personId: 1 });

const PhotoPerson: Model<IPhotoPerson> = mongoose.models.PhotoPerson || mongoose.model<IPhotoPerson>('PhotoPerson', PhotoPersonSchema);

export default PhotoPerson;
