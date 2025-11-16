import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDownload extends Document {
  userId: mongoose.Types.ObjectId;
  photoId?: mongoose.Types.ObjectId;
  albumId: mongoose.Types.ObjectId;
  downloadType: 'single' | 'selection' | 'album';
  photoIds?: mongoose.Types.ObjectId[]; // For selection downloads
  fileSize: number;
  createdAt: Date;
}

const DownloadSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    photoId: {
      type: Schema.Types.ObjectId,
      ref: 'Photo',
    },
    albumId: {
      type: Schema.Types.ObjectId,
      ref: 'Album',
      required: [true, 'Album ID is required'],
      index: true,
    },
    downloadType: {
      type: String,
      enum: ['single', 'selection', 'album'],
      required: true,
    },
    photoIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Photo',
      },
    ],
    fileSize: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for better query performance
DownloadSchema.index({ userId: 1, createdAt: -1 });
DownloadSchema.index({ albumId: 1, createdAt: -1 });

const Download: Model<IDownload> = mongoose.models.Download || mongoose.model<IDownload>('Download', DownloadSchema);

export default Download;
