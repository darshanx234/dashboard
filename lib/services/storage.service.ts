import mongoose from 'mongoose';
import Album from '@/lib/models/Album';
import Photo from '@/lib/models/Photo';

export interface StorageInfo {
  used: number; // bytes
  limit: number; // bytes
  remaining: number; // bytes
  percentage: number; // 0-100
  usedFormatted: string; // e.g., "45.2 GB"
  limitFormatted: string; // e.g., "50 GB"
  remainingFormatted: string; // e.g., "4.8 GB"
}

export class StorageService {
  /**
   * Calculate total storage used by an album
   * Sums up all photo file sizes in the album
   */
  static async calculateAlbumStorage(albumId: mongoose.Types.ObjectId | string): Promise<number> {
    try {
      // Check if Photo model exists
      const photoModel = mongoose.models.Photo;
      if (!photoModel) {
        console.warn('Photo model not found, returning 0 storage');
        return 0;
      }

      const result = await Photo.aggregate([
        { $match: { albumId: new mongoose.Types.ObjectId(albumId.toString()) } },
        {
          $group: {
            _id: null,
            totalSize: { $sum: '$fileSize' }, // Assuming Photo model has fileSize field
          },
        },
      ]);

      return result.length > 0 ? result[0].totalSize : 0;
    } catch (error: any) {
      console.error('Error calculating album storage:', error);
      return 0;
    }
  }

  /**
   * Update album storage usage
   * Recalculates and updates the storageUsed field
   */
  static async updateAlbumStorage(albumId: mongoose.Types.ObjectId | string): Promise<void> {
    try {
      const totalStorage = await this.calculateAlbumStorage(albumId);
      
      await Album.findByIdAndUpdate(albumId, {
        storageUsed: totalStorage,
      });
    } catch (error: any) {
      console.error('Error updating album storage:', error);
      throw new Error(`Failed to update album storage: ${error.message}`);
    }
  }

  /**
   * Check if adding a file would exceed storage limit
   */
  static async canAddFile(
    albumId: mongoose.Types.ObjectId | string,
    fileSize: number
  ): Promise<{ allowed: boolean; reason?: string; storageInfo?: StorageInfo }> {
    try {
      const album = await Album.findById(albumId);
      if (!album) {
        return {
          allowed: false,
          reason: 'Album not found',
        };
      }

      // Check if album is expired
      if (album.isExpired || new Date() > album.planExpiresAt) {
        return {
          allowed: false,
          reason: 'Album plan has expired',
        };
      }

      const currentStorage = album.storageUsed || 0;
      const newTotal = currentStorage + fileSize;

      if (newTotal > album.storageLimit) {
        const storageInfo = await this.getStorageInfo(albumId);
        return {
          allowed: false,
          reason: `Storage limit exceeded. You need ${this.formatBytes(fileSize)} but only ${storageInfo.remainingFormatted} remaining.`,
          storageInfo,
        };
      }

      return { allowed: true };
    } catch (error: any) {
      console.error('Error checking file addition:', error);
      return {
        allowed: false,
        reason: 'Error checking storage limit',
      };
    }
  }

  /**
   * Get detailed storage information for an album
   */
  static async getStorageInfo(albumId: mongoose.Types.ObjectId | string): Promise<StorageInfo> {
    try {
      const album = await Album.findById(albumId);
      if (!album) {
        throw new Error('Album not found');
      }

      const used = album.storageUsed || 0;
      const limit = album.storageLimit;
      const remaining = Math.max(0, limit - used);
      const percentage = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

      return {
        used,
        limit,
        remaining,
        percentage: Math.round(percentage * 100) / 100, // Round to 2 decimals
        usedFormatted: this.formatBytes(used),
        limitFormatted: this.formatBytes(limit),
        remainingFormatted: this.formatBytes(remaining),
      };
    } catch (error: any) {
      console.error('Error getting storage info:', error);
      throw new Error(`Failed to get storage info: ${error.message}`);
    }
  }

  /**
   * Mark expired albums
   * Should be run periodically (e.g., daily cron job)
   */
  static async markExpiredAlbums(): Promise<number> {
    try {
      const result = await Album.updateMany(
        {
          planExpiresAt: { $lt: new Date() },
          isExpired: false,
        },
        {
          $set: { isExpired: true },
        }
      );

      return result.modifiedCount;
    } catch (error: any) {
      console.error('Error marking expired albums:', error);
      throw new Error(`Failed to mark expired albums: ${error.message}`);
    }
  }

  /**
   * Delete expired albums
   * Should be run periodically (e.g., daily cron job)
   */
  static async deleteExpiredAlbums(): Promise<number> {
    try {
      const expiredAlbums = await Album.find({
        planExpiresAt: { $lt: new Date() },
        isExpired: true,
      });

      let deletedCount = 0;
      for (const album of expiredAlbums) {
        // Delete all photos in the album
        if (mongoose.models.Photo) {
          await Photo.deleteMany({ albumId: album._id });
        }
        
        // Delete the album
        await Album.findByIdAndDelete(album._id);
        deletedCount++;
      }

      return deletedCount;
    } catch (error: any) {
      console.error('Error deleting expired albums:', error);
      throw new Error(`Failed to delete expired albums: ${error.message}`);
    }
  }

  /**
   * Format bytes to human-readable string
   */
  private static formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
