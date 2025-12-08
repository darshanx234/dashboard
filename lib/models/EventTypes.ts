import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEventType extends Document {
  eventtypename: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventTypeSchema: Schema = new Schema(
  {
    eventtypename: {
      type: String,
      required: [true, 'Event type name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Event type name cannot exceed 100 characters'],
    },
    id: {
      type: String,
      required: [true, 'Event type ID is required'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
EventTypeSchema.index({ eventtypename: 1 });
EventTypeSchema.index({ id: 1 });

const EventType: Model<IEventType> = mongoose.models.EventType || mongoose.model<IEventType>('EventType', EventTypeSchema);

export default EventType;
