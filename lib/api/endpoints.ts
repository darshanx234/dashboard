export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  USERS: {
    LIST: '/users',
    GET: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },
  ALBUMS : {
    LIST: '/albums',
    GET: (id: string) => `/albums/${id}`,
    CREATE: '/albums',
    UPDATE: (id: string) => `/albums/${id}`,
    DELETE: (id: string) => `/albums/${id}`,
  },
  PHOTOS: {
    LIST: (albumId: string) => `/albums/${albumId}/photos`,
    GET: (albumId: string, photoId: string) => `/albums/${albumId}/photos/${photoId}`,
    CREATE: (albumId: string) => `/albums/${albumId}/photos`,
    UPDATE: (albumId: string, photoId: string) => `/albums/${albumId}/photos/${photoId}`,
    DELETE: (albumId: string) => `/albums/${albumId}/photos`,
    BULK_DELETE: (albumId: string) => `/albums/${albumId}/photos/bulk`,
  },
  UPLOAD: {
    PRESIGNED: '/upload/presigned',
    COMPLETE: '/upload/complete',
  }
  // Add more endpoints as needed
};