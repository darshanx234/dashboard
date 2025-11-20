'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';
import type { Album, CreateAlbumData, UpdateAlbumData } from '../api/albums';

export async function createAlbumAction(data: CreateAlbumData) {
  const response = await ApiClient.post(
    API_ENDPOINTS.ALBUMS.CREATE,
    data,
    true // requires auth
  );

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error || 'Failed to create album',
    };
  }

  revalidatePath('/albums');
  revalidatePath('/my-albums');
  
  return {
    success: true,
    data: response.data,
  };
}

export async function updateAlbumAction(id: string, data: UpdateAlbumData) {
  const response = await ApiClient.put(
    API_ENDPOINTS.ALBUMS.UPDATE(id),
    data,
    true // requires auth
  );

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error || 'Failed to update album',
    };
  }

  revalidatePath('/albums');
  revalidatePath('/my-albums');
  revalidatePath(`/albums/${id}`);
  
  return {
    success: true,
    data: response.data,
  };
}

export async function deleteAlbumAction(id: string) {
  const response = await ApiClient.delete(
    API_ENDPOINTS.ALBUMS.DELETE(id),
    true // requires auth
  );

  if (!response.success) {
    return {
      success: false,
      error: response.error || 'Failed to delete album',
    };
  }

  revalidatePath('/albums');
  revalidatePath('/my-albums');
  
  return {
    success: true,
    data: response.data,
  };
}

export async function getAlbumsAction(params?: { 
  status?: string; 
  page?: number; 
  limit?: number; 
}) {
  try {
    let endpoint = API_ENDPOINTS.ALBUMS.LIST;
    
    // Add query parameters if provided
    if (params) {
      const query = new URLSearchParams();
      if (params.status) query.append('status', params.status);
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
        error: response.error || 'Failed to fetch albums',
        data: null,
      };
    }

    return {
      success: true,
      data: response.data ,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch albums',
      data: null,
    };
  }
}

export async function getAlbumAction(id: string) {
  try {
    const response = await ApiClient.get(
      API_ENDPOINTS.ALBUMS.GET(id),
      true // requires auth
    );

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to fetch album',
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
      error: error instanceof Error ? error.message : 'Failed to fetch album',
      data: null,
    };
  }
}

// // Action for publishing an album (changing status to published)
// export async function publishAlbumAction(id: string) {
//   return updateAlbumAction(id, { status: 'published' });
// }

// // Action for archiving an album
// export async function archiveAlbumAction(id: string) {
//   return updateAlbumAction(id, { status: 'archived' });
// }

// // Action for making album draft
// export async function draftAlbumAction(id: string) {
//   return updateAlbumAction(id, { status: 'draft' });
// }

// // Action to toggle album privacy
// export async function toggleAlbumPrivacyAction(id: string, isPrivate: boolean) {
//   return updateAlbumAction(id, { isPrivate });
// }

// // Action to update album downloads permission
// export async function updateAlbumDownloadsAction(id: string, allowDownloads: boolean) {
//   return updateAlbumAction(id, { allowDownloads });
// }

// // Action to update album favorites permission
// export async function updateAlbumFavoritesAction(id: string, allowFavorites: boolean) {
//   return updateAlbumAction(id, { allowFavorites });
// }

// // Action to set album password
// export async function setAlbumPasswordAction(id: string, password?: string) {
//   return updateAlbumAction(id, { password });
// }

// // Action to set album cover photo
// export async function setAlbumCoverAction(id: string, coverPhoto: string) {
//   return updateAlbumAction(id, { coverPhoto });
// }
