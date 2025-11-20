'use server';

import { revalidatePath } from 'next/cache';
import { ApiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';
import type { Photo, CreatePhotoData, PresignedUrlResponse } from '../api/albums';

export async function getPhotosAction(
  albumId: string, 
  params?: { page?: number; limit?: number }
) {
  try {
    let endpoint = API_ENDPOINTS.PHOTOS.LIST(albumId);
    
    // Add query parameters if provided
    if (params) {
      const query = new URLSearchParams();
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());
      
      const queryString = query.toString();
      if (queryString) {
        endpoint = `${endpoint}?${queryString}`;
      }
    }

    const response = await ApiClient.get(endpoint, true);

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to fetch photos',
        data: null,
      };
    }

    return {
      success: true,
      data: response.data as {
        photos: Photo[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      },
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch photos',
      data: null,
    };
  }
}

export async function getPhotoAction(albumId: string, photoId: string) {
  try {
    const response = await ApiClient.get(
      API_ENDPOINTS.PHOTOS.GET(albumId, photoId),
      true // requires auth
    );

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to fetch photo',
        data: null,
      };
    }

    return {
      success: true,
      data: response.data,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch photo',
      data: null,
    };
  }
}

export async function createPhotoAction(albumId: string, data: CreatePhotoData) {
  const response = await ApiClient.post(
    API_ENDPOINTS.PHOTOS.CREATE(albumId),
    data,
    true // requires auth
  );

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error || 'Failed to create photo record',
    };
  }

  revalidatePath(`/albums/${albumId}`);
  revalidatePath('/albums');
  
  return {
    success: true,
    data: response.data,
  };
}

export async function updatePhotoAction(
  albumId: string, 
  photoId: string, 
  data: Partial<CreatePhotoData>
) {
  const response = await ApiClient.put(
    API_ENDPOINTS.PHOTOS.UPDATE(albumId, photoId),
    data,
    true // requires auth
  );

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error || 'Failed to update photo',
    };
  }

  revalidatePath(`/albums/${albumId}`);
  revalidatePath('/albums');
  
  return {
    success: true,
    data: response.data,
  };
}

export async function deletePhotosAction(albumId: string, photoIds: string[]) {
  const response = await ApiClient.delete(
    API_ENDPOINTS.PHOTOS.DELETE(albumId),
    true // requires auth
  );

  if (!response.success) {
    return {
      success: false,
      error: response.error || 'Failed to delete photos',
    };
  }

  revalidatePath(`/albums/${albumId}`);
  revalidatePath('/albums');
  
  return {
    success: true,
    data: response.data,
  };
}

export async function bulkDeletePhotosAction(albumId: string, photoIds: string[]) {
  const response = await ApiClient.post(
    API_ENDPOINTS.PHOTOS.BULK_DELETE(albumId),
    { photoIds },
    true // requires auth
  );

  if (!response.success) {
    return {
      success: false,
      error: response.error || 'Failed to delete photos',
    };
  }

  revalidatePath(`/albums/${albumId}`);
  revalidatePath('/albums');
  
  return {
    success: true,
    data: response.data,
  };
}

// Upload-related actions
export async function getPresignedUrlAction(data: {
  albumId: string;
  filename: string;
  mimeType: string;
  fileSize: number;
}) {
  try {
    const response = await ApiClient.post(
      API_ENDPOINTS.UPLOAD.PRESIGNED,
      data,
      true // requires auth
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to get presigned URL',
        data: null,
      };
    }

    return {
      success: true,
      data: response.data as PresignedUrlResponse,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get presigned URL',
      data: null,
    };
  }
}

export async function uploadToS3Action(url: string, file: File) {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: 'Failed to upload file to S3',
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    };
  }
}

// Helper function to get image dimensions
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

// Complete upload flow action
export async function uploadPhotoAction(
  albumId: string, 
  file: File, 
  order?: number
): Promise<{
  success: boolean;
  data?: Photo;
  error?: string;
}> {
  try {
    // Step 1: Get pre-signed URL
    const presignedResult = await getPresignedUrlAction({
      albumId,
      filename: file.name,
      mimeType: file.type,
      fileSize: file.size,
    });

    if (!presignedResult.success || !presignedResult.data) {
      return {
        success: false,
        error: presignedResult.error || 'Failed to get upload URL',
      };
    }

    const { uploadUrl, s3Key } = presignedResult.data;

    // Step 2: Upload to S3
    const uploadResult = await uploadToS3Action(uploadUrl, file);
    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error || 'Failed to upload file',
      };
    }

    // Step 3: Get file dimensions if it's an image
    let width: number | undefined;
    let height: number | undefined;

    if (file.type.startsWith('image/')) {
      try {
        const dimensions = await getImageDimensions(file);
        width = dimensions.width;
        height = dimensions.height;
      } catch (error) {
        console.warn('Failed to get image dimensions:', error);
        // Continue without dimensions
      }
    }

    // Step 4: Create photo record in database
    const s3Url = `https://${'photoalumnus'}.s3.${'ap-south-1'}.amazonaws.com/${s3Key}`;

    const createResult = await createPhotoAction(albumId, {
      filename: file.name,
      originalName: file.name,
      s3Key,
      s3Url,
      fileSize: file.size,
      mimeType: file.type,
      width,
      height,
      order: order || 0,
    });

    if (!createResult.success) {
      return {
        success: false,
        error: createResult.error || 'Failed to save photo record',
      };
    }

    return {
      success: true,
      data: createResult.data?.photo,
    };
  } catch (error) {
    console.error('Upload photo error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload photo',
    };
  }
}

// Batch upload action
export async function batchUploadPhotosAction(
  albumId: string,
  files: File[]
): Promise<{
  success: boolean;
  data?: {
    successful: Photo[];
    failed: Array<{ file: File; error: string }>;
  };
  error?: string;
}> {
  try {
    const results = await Promise.allSettled(
      files.map((file, index) => uploadPhotoAction(albumId, file, index))
    );

    const successful: Photo[] = [];
    const failed: Array<{ file: File; error: string }> = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success && result.value.data) {
        successful.push(result.value.data);
      } else {
        failed.push({
          file: files[index],
          error: result.status === 'fulfilled' 
            ? result.value.error || 'Unknown error'
            : 'Upload failed'
        });
      }
    });

    return {
      success: true,
      data: { successful, failed },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload photos',
    };
  }
}

// Photo management actions
export async function reorderPhotosAction(
  albumId: string,
  photoOrders: Array<{ photoId: string; order: number }>
) {
  try {
    const response = await ApiClient.patch(
      `/albums/${albumId}/photos/reorder`,
      { photoOrders },
      true
    );

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to reorder photos',
      };
    }

    revalidatePath(`/albums/${albumId}`);
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder photos',
    };
  }
}

export async function setPhotoAsCoverAction(albumId: string, photoId: string) {
  try {
    const response = await ApiClient.patch(
      `/albums/${albumId}/cover`,
      { photoId },
      true
    );

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to set cover photo',
      };
    }

    revalidatePath(`/albums/${albumId}`);
    revalidatePath('/albums');
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set cover photo',
    };
  }
}

// Photo metadata actions
export async function updatePhotoMetadataAction(
  albumId: string,
  photoId: string,
  metadata: {
    capturedAt?: string;
    camera?: string;
    lens?: string;
    settings?: {
      iso?: number;
      aperture?: string;
      shutterSpeed?: string;
      focalLength?: string;
    };
  }
) {
  return updatePhotoAction(albumId, photoId, metadata);
}
