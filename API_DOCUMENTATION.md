# Photography Album Management - API Documentation

## Database Schema

### Collections Overview

1. **Users** - User accounts (photographer, client, admin)
2. **Albums** - Photo albums created by photographers
3. **Photos** - Individual photos within albums (stored in S3)
4. **AlbumShares** - Sharing permissions and access tokens
5. **Favorites** - User's favorited photos
6. **Downloads** - Download history tracking

---

## Database Models

### 1. Album Model
```typescript
{
  title: string (required, max 200 chars)
  description?: string (max 1000 chars)
  photographerId: ObjectId (indexed)
  photographerName: string
  photographerEmail: string
  coverPhoto?: string (S3 URL)
  shootDate?: Date
  location?: string (max 200 chars)
  isPrivate: boolean (default: false)
  password?: string (hashed)
  allowDownloads: boolean (default: true)
  allowFavorites: boolean (default: true)
  totalPhotos: number (default: 0)
  totalViews: number (default: 0)
  totalDownloads: number (default: 0)
  status: 'draft' | 'processing' | 'published' | 'archived'
  createdAt: Date
  updatedAt: Date
}
```

### 2. Photo Model
```typescript
{
  albumId: ObjectId (indexed)
  photographerId: ObjectId (indexed)
  filename: string
  originalName: string
  s3Key: string (unique, S3 object key)
  s3Url: string (public URL)
  thumbnailUrl?: string
  fileSize: number (bytes)
  mimeType: string
  width?: number
  height?: number
  capturedAt?: Date
  camera?: string
  lens?: string
  settings?: {
    iso?: number
    aperture?: string
    shutterSpeed?: string
    focalLength?: string
  }
  order: number (for sorting)
  isProcessed: boolean
  views: number
  downloads: number
  favoritesCount: number
  status: 'uploading' | 'processing' | 'ready' | 'error'
  createdAt: Date
  updatedAt: Date
}
```

### 3. AlbumShare Model
```typescript
{
  albumId: ObjectId (indexed)
  photographerId: ObjectId
  sharedWith: {
    userId?: ObjectId
    email: string (required)
    name?: string
  }
  shareType: 'link' | 'email' | 'direct'
  accessToken?: string (unique, indexed)
  expiresAt?: Date
  permissions: {
    canView: boolean
    canDownload: boolean
    canFavorite: boolean
    canComment: boolean
  }
  password?: string (hashed)
  views: number
  lastViewedAt?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### 4. Favorite Model
```typescript
{
  userId: ObjectId (indexed)
  photoId: ObjectId (indexed)
  albumId: ObjectId (indexed)
  createdAt: Date
}
// Unique constraint: (userId, photoId)
```

### 5. Download Model
```typescript
{
  userId: ObjectId (indexed)
  photoId?: ObjectId
  albumId: ObjectId (indexed)
  downloadType: 'single' | 'selection' | 'album'
  photoIds?: ObjectId[] (for selection downloads)
  fileSize: number
  createdAt: Date
}
```

---

## API Endpoints

### Album APIs

#### 1. Create Album
```
POST /api/albums
Authorization: Required (JWT token)
Role: photographer, admin

Request Body:
{
  "title": "Wedding - Sarah & John",
  "description": "Beautiful wedding ceremony",
  "shootDate": "2024-11-01",
  "location": "New York",
  "isPrivate": false,
  "password": "optional123",
  "allowDownloads": true,
  "allowFavorites": true
}

Response (201):
{
  "message": "Album created successfully",
  "album": { ...album object }
}
```

#### 2. Get All Albums
```
GET /api/albums?status=published&page=1&limit=20
Authorization: Required

Response (200):
{
  "albums": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

#### 3. Get Single Album
```
GET /api/albums/[id]
Authorization: Required

Response (200):
{
  "album": { ...album object }
}
```

#### 4. Update Album
```
PUT /api/albums/[id]
Authorization: Required (owner only)

Request Body:
{
  "title": "Updated Title",
  "status": "published",
  ...other fields
}

Response (200):
{
  "message": "Album updated successfully",
  "album": { ...updated album }
}
```

#### 5. Delete Album
```
DELETE /api/albums/[id]
Authorization: Required (owner only)

Response (200):
{
  "message": "Album and all photos deleted successfully"
}
```

---

### Photo APIs

#### 6. Get Album Photos
```
GET /api/albums/[id]/photos?page=1&limit=50
Authorization: Required

Response (200):
{
  "photos": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 245,
    "pages": 5
  }
}
```

#### 7. Add Photo to Album
```
POST /api/albums/[id]/photos
Authorization: Required (owner only)

Request Body:
{
  "filename": "IMG_001.jpg",
  "originalName": "DSC_1234.jpg",
  "s3Key": "photos/user123/album456/1699123456-abc123.jpg",
  "s3Url": "https://bucket.s3.amazonaws.com/...",
  "thumbnailUrl": "https://bucket.s3.amazonaws.com/...thumb.jpg",
  "fileSize": 4567890,
  "mimeType": "image/jpeg",
  "width": 4000,
  "height": 3000,
  "order": 1
}

Response (201):
{
  "message": "Photo added successfully",
  "photo": { ...photo object }
}
```

---

### Upload APIs

#### 8. Generate Pre-signed Upload URL
```
POST /api/upload/presigned
Authorization: Required

Request Body:
{
  "albumId": "album123",
  "filename": "photo.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 4567890
}

Response (200):
{
  "uploadUrl": "https://bucket.s3.amazonaws.com/...?signature=...",
  "s3Key": "photos/user123/album456/1699123456-abc123.jpg",
  "expiresIn": 300
}

Usage Flow:
1. Get pre-signed URL from this endpoint
2. Upload file directly to S3 using PUT request to uploadUrl
3. After successful S3 upload, call POST /api/albums/[id]/photos
```

---

### Share APIs

#### 9. Share Album
```
POST /api/albums/[id]/share
Authorization: Required (owner only)

Request Body (Link Share):
{
  "shareType": "link",
  "permissions": {
    "canView": true,
    "canDownload": true,
    "canFavorite": true,
    "canComment": false
  },
  "expiresAt": "2024-12-31T23:59:59Z",
  "password": "optional123"
}

Request Body (Email Share):
{
  "shareType": "email",
  "emails": [
    { "email": "client@example.com", "name": "Client Name" }
  ],
  "permissions": { ... },
  "expiresAt": "2024-12-31T23:59:59Z"
}

Response (201):
{
  "message": "Album shared successfully",
  "shares": [
    {
      "_id": "share123",
      "accessToken": "a1b2c3d4...",
      "shareType": "link",
      ...
    }
  ]
}
```

#### 10. Get Album Shares
```
GET /api/albums/[id]/share
Authorization: Required (owner only)

Response (200):
{
  "shares": [
    {
      "_id": "share123",
      "sharedWith": { "email": "client@example.com" },
      "accessToken": "a1b2c3d4...",
      "views": 15,
      "isActive": true,
      ...
    }
  ]
}
```

---

### Public Access APIs

#### 11. Access Shared Album
```
GET /api/shared/[token]
Authorization: Not required

Response (200):
{
  "album": {
    "id": "album123",
    "title": "Wedding Photos",
    "description": "...",
    "photographerName": "John Doe",
    "totalPhotos": 245
  },
  "photos": [...],
  "permissions": {
    "canView": true,
    "canDownload": true,
    "canFavorite": true
  },
  "requiresPassword": true
}
```

#### 12. Verify Album Password
```
POST /api/shared/[token]/verify
Authorization: Not required

Request Body:
{
  "password": "album123"
}

Response (200):
{
  "verified": true
}

Response (401):
{
  "error": "Invalid password"
}
```

---

## S3 Storage Structure

```
bucket-name/
├── photos/
│   ├── {photographerId}/
│   │   ├── {albumId}/
│   │   │   ├── {timestamp}-{random}.jpg (original)
│   │   │   ├── {timestamp}-{random}_thumb.jpg (thumbnail)
│   │   │   └── ...
```

---

## Environment Variables Required

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=your-secret-key

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_CLOUDFRONT_URL=https://d123456.cloudfront.net (optional)
```

---

## Photo Upload Flow

### Step 1: Request Pre-signed URL
```javascript
const response = await fetch('/api/upload/presigned', {
  method: 'POST',
  body: JSON.stringify({
    albumId: 'album123',
    filename: file.name,
    mimeType: file.type,
    fileSize: file.size,
  }),
});
const { uploadUrl, s3Key } = await response.json();
```

### Step 2: Upload to S3
```javascript
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type,
  },
});
```

### Step 3: Create Photo Record
```javascript
await fetch(`/api/albums/${albumId}/photos`, {
  method: 'POST',
  body: JSON.stringify({
    filename: file.name,
    originalName: file.name,
    s3Key: s3Key,
    s3Url: `https://bucket.s3.amazonaws.com/${s3Key}`,
    fileSize: file.size,
    mimeType: file.type,
    // ... other metadata
  }),
});
```

---

## Album Sharing Flow

### 1. Create Share Link
Photographer creates a share with permissions and optional password.

### 2. Share Access
- **Link Share**: Anyone with token can access
- **Email Share**: Specific email addresses get unique tokens
- **Direct Share**: Share with registered users

### 3. Access Album
Client accesses via `/shared/[token]` URL, verifies password if needed.

### 4. View & Download
Based on permissions, client can view, download, or favorite photos.

---

## NPM Packages Required

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## API Response Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request (validation error)
- **401** - Unauthorized (no token or invalid token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **410** - Gone (expired link)
- **500** - Internal Server Error
