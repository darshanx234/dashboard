import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  phone: string; // Now required and primary identifier
  email?: string; // Optional
  password?: string; // Optional (can be set later)
  firstName?: string;
  lastName?: string;
  fullName?: string; // Full name of the user
  businessName?: string; // For studio owners
  avatar?: string;
  bio?: string;
  userType: 'photographer' | 'studio_owner'; // Type of user
  role: 'photographer' | 'client' | 'admin'; // Permission role
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema({
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    unique: true,
    match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian phone number'],
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
    validate: {
      validator: function(v: string) {
        // Only validate if password is provided
        if (!v) return true;
        return v.length >= 6;
      },
      message: 'Password must be at least 6 characters'
    }
  },
  fullName: {
    type: String,
    default: '',
  },
  businessName: {
    type: String,
    default: '',
  },
  avatar: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    default: '',
  },
  userType: {
    type: String,
    enum: ['photographer', 'studio_owner'],
    required: [true, 'Please specify user type'],
  },
  role: {
    type: String,
    enum: ['photographer', 'client', 'admin'],
    default: 'photographer',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving (only if password exists)
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema);
