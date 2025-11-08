/*
  # Photography Album Management System Schema

  1. New Tables
    - `albums`: Stores album metadata
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text)
      - `description` (text)
      - `date_taken` (date)
      - `location` (text)
      - `privacy_setting` (enum: 'private', 'password_protected', 'public')
      - `cover_photo_id` (uuid, foreign key to photos)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `photos`: Stores individual photo records
      - `id` (uuid, primary key)
      - `album_id` (uuid, foreign key to albums)
      - `file_url` (text)
      - `thumbnail_url` (text)
      - `file_size` (bigint)
      - `width` (integer)
      - `height` (integer)
      - `order_index` (integer)
      - `created_at` (timestamp)
    
    - `shares`: Stores share configurations
      - `id` (uuid, primary key)
      - `album_id` (uuid, foreign key to albums)
      - `share_token` (text, unique)
      - `password_hash` (text)
      - `allow_download` (boolean)
      - `allow_favorites` (boolean)
      - `expires_at` (timestamp)
      - `created_at` (timestamp)
    
    - `favorites`: Stores client favorite markings
      - `id` (uuid, primary key)
      - `photo_id` (uuid, foreign key to photos)
      - `share_id` (uuid, foreign key to shares)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add photographer policies for album management
    - Add client policies for shared album access
    - Add indexes for frequently queried columns

  3. Important Notes
    - Share tokens are used for public access without authentication
    - Password protection is optional and stored as hash
    - Photos maintain order via order_index
    - Favorites are tied to specific shares (different clients can mark different favorites)
*/

CREATE TABLE IF NOT EXISTS albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  date_taken date,
  location text,
  privacy_setting text NOT NULL DEFAULT 'private' CHECK (privacy_setting IN ('private', 'password_protected', 'public')),
  cover_photo_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  thumbnail_url text NOT NULL,
  file_size bigint NOT NULL,
  width integer,
  height integer,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  share_token text NOT NULL UNIQUE,
  password_hash text,
  allow_download boolean DEFAULT true,
  allow_favorites boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  share_id uuid NOT NULL REFERENCES shares(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(photo_id, share_id)
);

ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photographers can manage own albums"
  ON albums
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Photographers can view own album photos"
  ON photos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM albums WHERE albums.id = photos.album_id AND albums.user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can manage album photos"
  ON photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM albums WHERE albums.id = album_id AND albums.user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can update own album photos"
  ON photos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM albums WHERE albums.id = photos.album_id AND albums.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM albums WHERE albums.id = photos.album_id AND albums.user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can delete own album photos"
  ON photos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM albums WHERE albums.id = photos.album_id AND albums.user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can manage own shares"
  ON shares
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM albums WHERE albums.id = shares.album_id AND albums.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM albums WHERE albums.id = shares.album_id AND albums.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view shared albums"
  ON photos
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM shares 
      WHERE shares.album_id = photos.album_id 
      AND shares.share_token = current_setting('app.share_token', true)
    )
  );

CREATE POLICY "Clients can mark favorites on shared albums"
  ON favorites
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shares
      WHERE shares.id = favorites.share_id
      AND shares.allow_favorites = true
      AND shares.share_token = current_setting('app.share_token', true)
    )
  );

CREATE POLICY "Clients can view their own favorites"
  ON favorites
  FOR SELECT
  TO anon
  USING (
    share_id = (
      SELECT id FROM shares WHERE share_token = current_setting('app.share_token', true)
    )
  );

CREATE INDEX idx_albums_user_id ON albums(user_id);
CREATE INDEX idx_albums_created_at ON albums(created_at);
CREATE INDEX idx_photos_album_id ON photos(album_id);
CREATE INDEX idx_photos_order_index ON photos(album_id, order_index);
CREATE INDEX idx_shares_album_id ON shares(album_id);
CREATE INDEX idx_shares_token ON shares(share_token);
CREATE INDEX idx_favorites_share_id ON favorites(share_id);
CREATE INDEX idx_favorites_photo_id ON favorites(photo_id);
