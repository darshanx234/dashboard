import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAlbum extends Document {
  title: string;
  description?: string;
  photographerId: mongoose.Types.ObjectId;
  photographerName: string;
  photographerEmail: string;
  clientId?: string;
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
      required: true,
    },
    clientId: {
      type: String,
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
