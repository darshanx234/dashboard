import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAlbum extends Document {
  title: string;
  description?: string;
  photographerId: mongoose.Types.ObjectId;
  photographerName: string;
  photographerEmail: string;
  clientId?: string;
  eventType?: mongoose.Types.ObjectId;
  coverPhoto?: string; // S3 URL
  shootDate?: Date;
  location?: string;
  isPrivate: boolean;
  password?: string;
  allowDownloads: boolean;
  allowFavorites: boolean;
  totalPhotos: number;
  totalViews: number;
  totalDownloads: number;
  status: 'draft' | 'processing' | 'published' | 'archived';
  // Plan-related fields
  planId?: mongoose.Types.ObjectId;
  planName: string;
  planPrice: number; // Credits paid for this album
  storageLimit: number; // Storage limit in bytes
  storageLimitGB: number; // Storage limit in GB (for display)
  storageUsed: number; // Current storage used in bytes
  planExpiresAt: Date; // When the album plan expires
  isExpired: boolean; // Computed: whether plan has expired
  createdAt: Date;
  updatedAt: Date;
}

const AlbumSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Album title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    photographerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Photographer ID is required'],
      index: true,
    },
    photographerName: {
      type: String,
      //   required: true,
    },
    photographerEmail: {
      type: String,
      // required: true,
    },
    clientId: {
      type: String,
      index: true,
    },
    eventType: {
      type: Schema.Types.ObjectId,
      ref: 'EventType',
      index: true,
    },
    coverPhoto: {
      type: String, // S3 URL
    },
    shootDate: {
      type: Date,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String, // Hashed password for album access
    },
    allowDownloads: {
      type: Boolean,
      default: true,
    },
    allowFavorites: {
      type: Boolean,
      default: true,
    },
    totalPhotos: {
      type: Number,
      default: 0,
    },
    totalViews: {
      type: Number,
      default: 0,
    },
    totalDownloads: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'processing', 'published', 'archived'],
      default: 'draft',
    },
    // Plan-related fields
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'AlbumPlan',
      index: true,
    },
    planName: {
      type: String,
      required: [true, 'Plan name is required'],
    },
    planPrice: {
      type: Number,
      required: [true, 'Plan price is required'],
      min: [0, 'Plan price cannot be negative'],
    },
    storageLimit: {
      type: Number,
      required: [true, 'Storage limit is required'],
      min: [0, 'Storage limit cannot be negative'],
    },
    storageLimitGB: {
      type: Number,
      required: [true, 'Storage limit in GB is required'],
      min: [0, 'Storage limit cannot be negative'],
    },
    storageUsed: {
      type: Number,
      default: 0,
      min: [0, 'Storage used cannot be negative'],
    },
    planExpiresAt: {
      type: Date,
      required: [true, 'Plan expiry date is required'],
      index: true,
    },
    isExpired: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
AlbumSchema.index({ photographerId: 1, createdAt: -1 });
AlbumSchema.index({ status: 1, createdAt: -1 });

const Album: Model<IAlbum> = mongoose.models.Album || mongoose.model<IAlbum>('Album', AlbumSchema);

export default Album;
