import { getWithAuth, postWithAuth, putWithAuth, deleteWithAuth } from '../api-client';

// Types
export interface Album {
  _id: string;
  title: string;
  description?: string;
  photographerId: string;
  photographerName: string;
  photographerEmail: string;
  coverPhoto?: string;
  shootDate?: string;
  location?: string;
  isPrivate: boolean;
  password?: string;
  allowDownloads: boolean;
  allowFavorites: boolean;
  totalPhotos: number;
  totalViews: number;
  totalDownloads: number;
  status: 'draft' | 'processing' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  _id: string;
  albumId: string;
  photographerId: string;
  filename: string;
  originalName: string;
  s3Key: string;
  s3Url: string;
  url?: string; // Presigned URL for accessing the photo
  thumbnailUrl?: string; // Presigned URL for thumbnail
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  capturedAt?: string;
  camera?: string;
  lens?: string;
  settings?: {
    iso?: number;
    aperture?: string;
    shutterSpeed?: string;
    focalLength?: string;
  };
  order: number;
  isProcessed: boolean;
  views: number;
  downloads: number;
  favoritesCount: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlbumData {
  title: string;
  description?: string;
  shootDate?: string;
  location?: string;
  isPrivate?: boolean;
  password?: string;
  allowDownloads?: boolean;
  allowFavorites?: boolean;
}

export interface UpdateAlbumData extends CreateAlbumData {
  status?: 'draft' | 'processing' | 'published' | 'archived';
  coverPhoto?: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  s3Key: string;
  expiresIn: number;
}

export interface CreatePhotoData {
  filename: string;
  originalName: string;
  s3Key: string;
  s3Url: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  capturedAt?: string;
  camera?: string;
  lens?: string;
  settings?: {
    iso?: number;
    aperture?: string;
    shutterSpeed?: string;
    focalLength?: string;
  };
  order?: number;
}

// Album APIs
export const albumApi = {
  // Get all albums
  async getAlbums(params?: { status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString();
    const url = `/api/albums${queryString ? `?${queryString}` : ''}`;

    return getWithAuth<{
      albums: Album[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(url);
  },

  // Get single album
  async getAlbum(id: string) {
    return getWithAuth<{ album: Album }>(`/api/albums/${id}`);
  },

  // Create album
  async createAlbum(data: CreateAlbumData) {
    return postWithAuth<{ message: string; album: Album }>('/api/albums', data);
  },

  // Update album
  async updateAlbum(id: string, data: UpdateAlbumData) {
    return putWithAuth<{ message: string; album: Album }>(`/api/albums/${id}`, data);
  },

  // Delete album
  async deleteAlbum(id: string) {
    return deleteWithAuth<{ message: string }>(`/api/albums/${id}`);
  },
};

// Photo APIs
export const photoApi = {
  // Get photos in album
  async getPhotos(albumId: string, params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString();
    const url = `/api/albums/${albumId}/photos${queryString ? `?${queryString}` : ''}`;

    return getWithAuth<{
      photos: Photo[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(url);
  },

  // Add photo metadata (after S3 upload)
  async createPhoto(albumId: string, data: CreatePhotoData) {
    return postWithAuth<{ message: string; photo: Photo }>(
      `/api/albums/${albumId}/photos`,
      data
    );
  },

  // Delete multiple photos
  async deletePhotos(albumId: string, photoIds: string[]) {
    return deleteWithAuth<{ message: string }>(
      `/api/albums/${albumId}/photos`,
      { photoIds }
    );
  },
};

// Upload APIs
export const uploadApi = {
  // Get pre-signed URL for S3 upload
  async getPresignedUrl(data: {
    albumId: string;
    filename: string;
    mimeType: string;
    fileSize: number;
  }) {
    return postWithAuth<PresignedUrlResponse>('/api/upload/presigned', data);
  },

  // Upload file directly to S3 using pre-signed URL
  async uploadToS3(url: string, file: File, signal?: AbortSignal) {
    const response = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
      signal,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file to S3');
    }

    return response;
  },

  // Complete upload flow: get presigned URL, upload to S3, create photo record
  async uploadPhoto(albumId: string, file: File, order?: number): Promise<Photo> {
    try {
      // Step 1: Get pre-signed URL
      const { uploadUrl, s3Key } = await this.getPresignedUrl({
        albumId,
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });

      // Step 2: Upload to S3
      await this.uploadToS3(uploadUrl, file);

      // Step 3: Get file dimensions if it's an image
      let width: number | undefined;
      let height: number | undefined;

      if (file.type.startsWith('image/')) {
        const dimensions = await getImageDimensions(file);
        width = dimensions.width;
        height = dimensions.height;
      }

      // Step 4: Create photo record in database
      const s3Url = `https://${'photoalumnus'}.s3.${'ap-south-1'}.amazonaws.com/${s3Key}`;

      const { photo } = await photoApi.createPhoto(albumId, {
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

      return photo;
    } catch (error) {
      console.error('Upload photo error:', error);
      throw error;
    }
  },
};

// Share API
export interface SharePermissions {
  canView: boolean;
  canDownload: boolean;
  canFavorite: boolean;
  canComment: boolean;
}

export interface AlbumShare {
  _id: string;
  albumId: string;
  photographerId: string;
  sharedWith: {
    userId?: string;
    email: string;
    name?: string;
  };
  shareType: 'link' | 'email' | 'direct';
  accessToken?: string;
  expiresAt?: string;
  permissions: SharePermissions;
  password?: string;
  views: number;
  lastViewedAt?: string;
  isActive: boolean;
  shareUrl?: string;
  isExpired?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShareData {
  shareType: 'link' | 'email';
  emails?: Array<{ email: string; name?: string }>;
  permissions?: SharePermissions;
  expiresAt?: string;
  password?: string;
  message?: string;
}

export interface UpdateShareData {
  shareId: string;
  permissions?: SharePermissions;
  expiresAt?: string | null;
  password?: string | null;
}

export const shareApi = {
  // Create a new share (public link or private email shares)
  async createShare(albumId: string, data: CreateShareData): Promise<{ shares: AlbumShare[]; shareType: string }> {
    const response = await postWithAuth(`/api/albums/${albumId}/share`, data);
    return response as { shares: AlbumShare[]; shareType: string };
  },

  // Get all shares for an album
  async getShares(albumId: string): Promise<{
    shares: AlbumShare[];
    publicShare?: AlbumShare;
    privateShares: AlbumShare[];
    totalShares: number;
  }> {
    const response = await getWithAuth(`/api/albums/${albumId}/share`);
    return response as {
      shares: AlbumShare[];
      publicShare?: AlbumShare;
      privateShares: AlbumShare[];
      totalShares: number;
    };
  },

  // Update share settings
  async updateShare(albumId: string, data: UpdateShareData): Promise<{ share: AlbumShare }> {
    // Using fetch directly since we need PATCH method
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];

    const response = await fetch(`/api/albums/${albumId}/share`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update share');
    }

    return response.json();
  },

  // Revoke a specific share
  async revokeShare(albumId: string, shareId: string): Promise<{ share: AlbumShare }> {
    const response = await deleteWithAuth(`/api/albums/${albumId}/share?shareId=${shareId}`);
    return response as { share: AlbumShare };
  },

  // Revoke all shares for an album
  async revokeAllShares(albumId: string): Promise<{ revokedCount: number }> {
    const response = await deleteWithAuth(`/api/albums/${albumId}/share?all=true`);
    return response as { revokedCount: number };
  },

  // Access shared album (no auth required)
  async accessSharedAlbum(token: string): Promise<{
    album: Album;
    photos: Photo[];
    permissions: SharePermissions;
    requiresPassword: boolean;
    shareType: string;
    expiresAt?: string;
  }> {
    const response = await fetch(`/api/shared/${token}`, {
      credentials: 'include', // Include cookies for access token
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to access shared album');
    }
    return response.json();
  },

  // Verify password for protected shared album
  async verifySharePassword(token: string, password: string): Promise<{
    verified: boolean;
    accessToken?: string;
    expiresIn?: number;
  }> {
    const response = await fetch(`/api/shared/${token}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important: to receive and send cookies
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to verify password');
    }
    return response.json();
  },

  // Save client identity
  async saveClientIdentity(token: string, name: string, email?: string, clientIdentifier?: string): Promise<{
    success: boolean;
    clientId: string;
    message: string;
    isReturningClient?: boolean;
  }> {
    const response = await fetch(`/api/shared/${token}/client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, clientIdentifier }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save identity');
    }
    return response.json();
  },

  // Track interaction
  async trackInteraction(
    token: string,
    event: string,
    data?: {
      clientId?: string;
      photoId?: string;
      comment?: string;
      meta?: Record<string, any>;
    }
  ): Promise<{ success: boolean; interactionId: string }> {
    const response = await fetch(`/api/shared/${token}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ event, ...data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to track interaction');
    }
    return response.json();
  },

  // Toggle favorite
  async toggleFavorite(
    token: string,
    photoId: string,
    isFavorite: boolean,
    clientId?: string
  ): Promise<{
    success: boolean;
    isFavorite: boolean;
    favoritesCount: number;
  }> {
    const response = await fetch(`/api/shared/${token}/favorite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ photoId, isFavorite, clientId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to toggle favorite');
    }
    return response.json();
  },

  // Add comment
  async addComment(
    token: string,
    photoId: string,
    comment: string,
    clientId?: string
  ): Promise<{
    success: boolean;
    comment: {
      _id: string;
      comment: string;
      clientName: string;
      createdAt: string;
    };
  }> {
    const response = await fetch(`/api/shared/${token}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ photoId, comment, clientId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add comment');
    }
    return response.json();
  },

  // Get comments
  async getComments(
    token: string,
    photoId?: string
  ): Promise<{
    comments: Array<{
      _id: string;
      comment: string;
      photoId?: string;
      photoName?: string;
      clientName: string;
      clientEmail?: string;
      createdAt: string;
    }>;
    total: number;
  }> {
    const url = photoId
      ? `/api/shared/${token}/comments?photoId=${photoId}`
      : `/api/shared/${token}/comments`;

    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get comments');
    }
    return response.json();
  },

  // Get interactions (photographer only)
  async getInteractions(token: string): Promise<{
    interactions: any[];
    clients: any[];
    eventSummary: any[];
    photoAnalytics: any[];
    totalInteractions: number;
  }> {
    // Get auth token from cookie
    const authToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];

    const response = await fetch(`/api/shared/${token}/interactions`, {
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get interactions');
    }
    return response.json();
  },
};

// Helper function to get image dimensions
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
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
