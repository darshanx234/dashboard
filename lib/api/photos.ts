import { getWithAuth } from '@/lib/utils/api-client';

// Photo Person Types
export interface PhotoPerson {
    id: string;
    personId: string;
    name?: string;
    isLabeled: boolean;
    boundingBox: {
        x: number; // Top-left x coordinate (0-1 normalized)
        y: number; // Top-left y coordinate (0-1 normalized)
        width: number; // Width (0-1 normalized)
        height: number; // Height (0-1 normalized)
    };
    confidence: number; // Face detection confidence score (0-1)
    thumbnailUrl?: string; // Presigned S3 URL for person's face thumbnail
}

// Photo Persons API
export const photosApi = {
    /**
     * Get all persons detected in a photo
     * @param photoId - The ID of the photo
     * @returns Promise with persons array and count
     */
    async getPhotoPersons(photoId: string): Promise<{
        success: boolean;
        persons: PhotoPerson[];
        count: number;
    }> {
        return getWithAuth<{
            success: boolean;
            persons: PhotoPerson[];
            count: number;
        }>(`/api/photo/${photoId}/persons`);
    },
};
