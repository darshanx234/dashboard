import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAlbumPlan extends Document {
  name: string;
  description: string;
  price: number; // Price in rupees (₹99, ₹149, ₹199, ₹249)
  storageLimit: number; // Storage limit in bytes
  storageLimitGB: number; // Storage limit in GB (for display)
  durationDays: number; // Plan duration in days (365 for 1 year)
  features: string[]; // List of features
  isActive: boolean;
  displayOrder: number; // For sorting plans in UI
  isRecommended: boolean; // Highlight as recommended plan
  createdAt: Date;
  updatedAt: Date;
}

const AlbumPlanSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Plan description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Plan price is required'],
      min: [0, 'Price cannot be negative'],
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
    durationDays: {
      type: Number,
      required: [true, 'Duration is required'],
      default: 365, // 1 year
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isRecommended: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
AlbumPlanSchema.index({ isActive: 1, displayOrder: 1 });
AlbumPlanSchema.index({ price: 1 });

const AlbumPlan: Model<IAlbumPlan> = mongoose.models.AlbumPlan || mongoose.model<IAlbumPlan>('AlbumPlan', AlbumPlanSchema);

export default AlbumPlan;
