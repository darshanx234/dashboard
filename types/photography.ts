export type PrivacySetting = 'private' | 'password_protected' | 'public';

export interface Album {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  date_taken: string | null;
  location: string | null;
  privacy_setting: PrivacySetting;
  cover_photo_id: string | null;
  created_at: string;
  updated_at: string;
  photo_count?: number;
}

export interface Photo {
  id: string;
  album_id: string;
  file_url: string;
  thumbnail_url: string;
  file_size: number;
  width: number | null;
  height: number | null;
  order_index: number;
  created_at: string;
}

export interface Share {
  id: string;
  album_id: string;
  share_token: string;
  password_hash: string | null;
  allow_download: boolean;
  allow_favorites: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface Favorite {
  id: string;
  photo_id: string;
  share_id: string;
  created_at: string;
}
