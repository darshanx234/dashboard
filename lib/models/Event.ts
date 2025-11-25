import mongoose, { Schema, Document, Model } from 'mongoose';

export type EventType = 'wedding' | 'portrait' | 'corporate' | 'event' | 'other';
export type EventStatus = 'scheduled' | 'completed' | 'cancelled';

export interface IEvent extends Document {
    _id: string;
    photographerId: string;
    clientId: string;
    albumId?: string;
    title: string;
    description?: string;
    type: EventType;
    status: EventStatus;
    startDate: Date;
    endDate: Date;
    location?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
    {
        photographerId: {
            type: String,
            required: true,
            index: true,
        },
        clientId: {
            type: String,
            required: true,
            index: true,
        },
        albumId: {
            type: String,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['wedding', 'portrait', 'corporate', 'event', 'other'],
            default: 'other',
        },
        status: {
            type: String,
            required: true,
            enum: ['scheduled', 'completed', 'cancelled'],
            default: 'scheduled',
        },
        startDate: {
            type: Date,
            required: true,
            index: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        location: {
            type: String,
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Create compound indexes for efficient queries
EventSchema.index({ photographerId: 1, startDate: 1 });
EventSchema.index({ photographerId: 1, clientId: 1 });
EventSchema.index({ photographerId: 1, type: 1 });
EventSchema.index({ photographerId: 1, status: 1 });

const Event: Model<IEvent> =
    mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;
