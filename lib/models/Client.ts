import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClient extends Document {
    _id: string;
    photographerId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    notes?: string;
    albumIds: string[];
    eventIds: string[];
    createdAt: Date;
    updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
    {
        photographerId: {
            type: String,
            required: true,
            index: true,
        },
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
        },
        albumIds: {
            type: [String],
            default: [],
        },
        eventIds: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Create compound index for photographer + email uniqueness
ClientSchema.index({ photographerId: 1, email: 1 }, { unique: true });

// Create text index for search
ClientSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

const Client: Model<IClient> =
    mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);

export default Client;
