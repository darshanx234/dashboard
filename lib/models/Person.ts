import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmbedding {
    vectorId: string; // ID in FAISS
    vector: number[]; // The 512-D float array
    createdAt: Date;
}

export interface IPerson extends Document {
    photographerId: mongoose.Types.ObjectId;
    name?: string; // Optional - set when user labels the person
    isLabeled: boolean; // Whether the person has been identified/named
    faceEncoding?: number[]; // Face embedding vector for clustering
    embeddings: IEmbedding[]; // Multiple face embeddings for this person
    representativePhotoId?: mongoose.Types.ObjectId; // Photo to use as thumbnail
    thumbnailS3Key?: string; // S3 key for face crop thumbnail
    thumbnailUrl?: string; // S3 URL for face crop thumbnail
    photoCount: number; // Number of photos this person appears in
    createdAt: Date;
    updatedAt: Date;
}

const EmbeddingSchema = new Schema({
    vectorId: { type: String, required: true }, // ID in FAISS
    vector: { type: [Number], required: true }, // The 512-D float array
    createdAt: { type: Date, default: Date.now }
});

const PersonSchema: Schema = new Schema(
    {
        photographerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Photographer ID is required'],
            index: true,
        },
        name: {
            type: String,
            trim: true,
        },
        isLabeled: {
            type: Boolean,
            default: false,
        },
        faceEncoding: {
            type: [Number],
            select: false, // Don't include by default in queries (large array)
        },
        embeddings: [EmbeddingSchema],
        representativePhotoId: {
            type: Schema.Types.ObjectId,
            ref: 'Photo',
        },
        thumbnailS3Key: {
            type: String,
        },
        thumbnailUrl: {
            type: String,
        },
        photoCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
PersonSchema.index({ photographerId: 1, isLabeled: 1 });
PersonSchema.index({ photographerId: 1, photoCount: -1 });
PersonSchema.index({ photographerId: 1, name: 1 });

const Person: Model<IPerson> = mongoose.models.Person || mongoose.model<IPerson>('Person', PersonSchema);

export default Person;
