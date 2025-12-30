export type PrivacySetting = 'private' | 'password_protected' | 'public';

export interface Album {
  id: string;
  title: string;
  description?: string;
  date_taken?: string;
  location?: string;
  privacy_setting: PrivacySetting;
  cover_photo_id?: string;
  photo_count?: number;
  created_at: string;
}

export interface Photo {
  id: string;
  album_id: string;
  file_url: string;
  thumbnail_url: string;
  file_size: number;
  width?: number;
  height?: number;
  created_at: string;
}
