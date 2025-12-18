import mongoose, { Schema, Document, Model } from 'mongoose';

// Variant type for each photo version
export interface IPhotoVariant {
  s3Key: string;
  s3Url: string;
  mimeType: string;
  width?: number;
  height?: number;
  fileSize?: number;
}

// All available variants
export interface IPhotoVariants {
  original?: IPhotoVariant;
  webp?: IPhotoVariant;
  thumbnail?: IPhotoVariant;
}

export interface IPhoto extends Document {
  albumId: mongoose.Types.ObjectId;
  photographerId: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  s3Key: string; // S3 object key (for backwards compatibility)
  s3Url: string; // Public S3 URL (for backwards compatibility)
  thumbnailUrl?: string; // Thumbnail S3 URL (for backwards compatibility)
  variants?: IPhotoVariants; // Multi-variant storage
  fileSize: number; // in bytes
  mimeType: string;
  width?: number;
  height?: number;
  capturedAt?: Date;
  camera?: string;
  lens?: string;
  settings?: {
    iso?: number;
    aperture?: string;
    shutterSpeed?: string;
    focalLength?: string;
  };
  order: number; // For sorting photos in album
  isProcessed: boolean;
  views: number;
  downloads: number;
  favoritesCount: number;
  personsCount: number; // Number of detected persons in this photo
  isFaceDetectionProcessed: boolean; // Whether face detection has been run
  status: 'uploading' | 'processing' | 'ready' | 'error';
  createdAt: Date;
  updatedAt: Date;
}


const PhotoSchema: Schema = new Schema(
  {
    albumId: {
      type: Schema.Types.ObjectId,
      ref: 'Album',
      required: [true, 'Album ID is required'],
      index: true,
    },
    photographerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Photographer ID is required'],
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
      unique: true,
    },
    s3Url: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    variants: {
      original: {
        s3Key: String,
        s3Url: String,
        mimeType: String,
        width: Number,
        height: Number,
        fileSize: Number,
      },
      webp: {
        s3Key: String,
        s3Url: String,
        mimeType: String,
        width: Number,
        height: Number,
        fileSize: Number,
      },
      thumbnail: {
        s3Key: String,
        s3Url: String,
        mimeType: String,
        width: Number,
        height: Number,
        fileSize: Number,
      },
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    capturedAt: {
      type: Date,
    },
    camera: {
      type: String,
    },
    lens: {
      type: String,
    },
    settings: {
      iso: Number,
      aperture: String,
      shutterSpeed: String,
      focalLength: String,
    },
    order: {
      type: Number,
      default: 0,
    },
    isProcessed: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    favoritesCount: {
      type: Number,
      default: 0,
    },
    personsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFaceDetectionProcessed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'error'],
      default: 'uploading',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
PhotoSchema.index({ albumId: 1, order: 1 });
PhotoSchema.index({ photographerId: 1, createdAt: -1 });
PhotoSchema.index({ status: 1 });
PhotoSchema.index({ photographerId: 1, isFaceDetectionProcessed: 1 });
PhotoSchema.index({ personsCount: 1 });

const Photo: Model<IPhoto> = mongoose.models.Photo || mongoose.model<IPhoto>('Photo', PhotoSchema);

export default Photo;
