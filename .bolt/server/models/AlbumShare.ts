import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAlbumShare extends Document {
  albumId: mongoose.Types.ObjectId;
  photographerId: mongoose.Types.ObjectId;
  sharedWith: {
    userId?: mongoose.Types.ObjectId;
    email: string;
    name?: string;
  };
  shareType: 'link' | 'email' | 'direct'; // link = public/anyone with link, email = invited, direct = specific user
  accessToken?: string; // For link-based sharing
  expiresAt?: Date;
  permissions: {
    canView: boolean;
    canDownload: boolean;
    canFavorite: boolean;
    canComment: boolean;
  };
  password?: string; // Optional password protection (hashed)
  views: number;
  lastViewedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlbumShareSchema: Schema = new Schema(
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
    sharedWith: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      name: {
        type: String,
        trim: true,
      },
    },
    shareType: {
      type: String,
      enum: ['link', 'email', 'direct'],
      required: true,
      default: 'email',
    },
    accessToken: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      index: true,
    },
    expiresAt: {
      type: Date,
    },
    permissions: {
      canView: {
        type: Boolean,
        default: true,
      },
      canDownload: {
        type: Boolean,
        default: true,
      },
      canFavorite: {
        type: Boolean,
        default: true,
      },
      canComment: {
        type: Boolean,
        default: false,
      },
    },
    password: {
      type: String, // Hashed password
    },
    views: {
      type: Number,
      default: 0,
    },
    lastViewedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
AlbumShareSchema.index({ albumId: 1, 'sharedWith.email': 1 });
AlbumShareSchema.index({ 'sharedWith.userId': 1 });
AlbumShareSchema.index({ accessToken: 1 });
AlbumShareSchema.index({ expiresAt: 1 });

const AlbumShare: Model<IAlbumShare> = mongoose.models.AlbumShare || mongoose.model<IAlbumShare>('AlbumShare', AlbumShareSchema);

export default AlbumShare;
