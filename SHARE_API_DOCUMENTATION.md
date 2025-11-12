# Album Share API Documentation

## Overview

The share functionality allows photographers to share albums with clients either publicly (via link) or privately (via email). It supports password protection, expiration dates, and granular permissions.

## Share Types

### 1. Public Link Sharing (`shareType: 'link'`)
- **Anyone with the link** can access the album
- Generates a unique access token
- Optional password protection
- Optional expiration date
- Only one public share per album (updates existing if creating again)

### 2. Private Email Sharing (`shareType: 'email'`)
- **Only specified users** can access via their unique link
- Each user gets a unique access token
- Can share with multiple users at once
- Each user can have different expiration dates
- No password protection (token is private per user)

## API Endpoints

### 1. Create Share

**Endpoint:** `POST /api/albums/[id]/share`

**Authentication:** Required (Album owner only)

#### Public Link Share
```typescript
POST /api/albums/123/share
{
  "shareType": "link",
  "permissions": {
    "canView": true,
    "canDownload": true,
    "canFavorite": true,
    "canComment": false
  },
  "expiresAt": "2025-12-31T23:59:59Z", // Optional
  "password": "mypassword123" // Optional
}
```

**Response:**
```json
{
  "message": "Public share link generated successfully",
  "shares": [
    {
      "_id": "share123",
      "albumId": "album123",
      "shareType": "link",
      "accessToken": "abc123def456...",
      "shareUrl": "http://localhost:3000/shared/abc123def456...",
      "permissions": {
        "canView": true,
        "canDownload": true,
        "canFavorite": true,
        "canComment": false
      },
      "expiresAt": "2025-12-31T23:59:59Z",
      "isActive": true,
      "views": 0,
      "createdAt": "2025-11-09T10:00:00Z"
    }
  ],
  "shareType": "link"
}
```

#### Private Email Share
```typescript
POST /api/albums/123/share
{
  "shareType": "email",
  "emails": [
    { "email": "client1@example.com", "name": "John Doe" },
    { "email": "client2@example.com", "name": "Jane Smith" }
  ],
  "permissions": {
    "canView": true,
    "canDownload": true,
    "canFavorite": false,
    "canComment": false
  },
  "expiresAt": "2025-12-31T23:59:59Z", // Optional
  "message": "Here are your wedding photos!" // Optional (for email notification)
}
```

**Response:**
```json
{
  "message": "Album shared with 2 user(s) successfully",
  "shares": [
    {
      "_id": "share456",
      "albumId": "album123",
      "shareType": "email",
      "sharedWith": {
        "email": "client1@example.com",
        "name": "John Doe"
      },
      "accessToken": "unique-token-1...",
      "shareUrl": "http://localhost:3000/shared/unique-token-1...",
      "permissions": { ... },
      "isActive": true,
      "views": 0
    },
    {
      "_id": "share789",
      "albumId": "album123",
      "shareType": "email",
      "sharedWith": {
        "email": "client2@example.com",
        "name": "Jane Smith"
      },
      "accessToken": "unique-token-2...",
      "shareUrl": "http://localhost:3000/shared/unique-token-2...",
      "permissions": { ... },
      "isActive": true,
      "views": 0
    }
  ],
  "shareType": "email"
}
```

---

### 2. Get All Shares

**Endpoint:** `GET /api/albums/[id]/share`

**Authentication:** Required (Album owner only)

**Response:**
```json
{
  "shares": [
    // All active shares
  ],
  "publicShare": {
    // Public link share if exists
  },
  "privateShares": [
    // Array of private email shares
  ],
  "totalShares": 5
}
```

---

### 3. Update Share Settings

**Endpoint:** `PATCH /api/albums/[id]/share`

**Authentication:** Required (Album owner only)

**Request:**
```typescript
PATCH /api/albums/123/share
{
  "shareId": "share123",
  "permissions": {
    "canDownload": false // Update specific permission
  },
  "expiresAt": "2025-12-15T23:59:59Z", // Update expiration
  "password": "newpassword" // Update password (or null to remove)
}
```

**Response:**
```json
{
  "message": "Share updated successfully",
  "share": {
    // Updated share object with shareUrl
  }
}
```

---

### 4. Revoke Share

**Endpoint:** `DELETE /api/albums/[id]/share?shareId=xxx`

**Authentication:** Required (Album owner only)

#### Revoke Specific Share
```
DELETE /api/albums/123/share?shareId=share456
```

**Response:**
```json
{
  "message": "Share revoked successfully",
  "share": {
    // Revoked share with isActive: false
  }
}
```

#### Revoke All Shares
```
DELETE /api/albums/123/share?all=true
```

**Response:**
```json
{
  "message": "All shares revoked successfully",
  "revokedCount": 5
}
```

---

### 5. Access Shared Album

**Endpoint:** `GET /api/shared/[token]`

**Authentication:** Not required (public endpoint)

**Response:**
```json
{
  "album": {
    "id": "album123",
    "title": "Wedding Photos",
    "description": "Beautiful wedding day",
    "photographerName": "John Photography",
    "totalPhotos": 150
  },
  "photos": [
    {
      "_id": "photo1",
      "url": "https://presigned-url...",
      "thumbnailUrl": "https://presigned-url...",
      "filename": "IMG_001.jpg",
      "width": 4000,
      "height": 3000,
      "fileSize": 2500000
    }
  ],
  "permissions": {
    "canView": true,
    "canDownload": true,
    "canFavorite": true,
    "canComment": false
  },
  "requiresPassword": false,
  "shareType": "link",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

---

### 6. Verify Share Password

**Endpoint:** `POST /api/shared/[token]/verify`

**Authentication:** Not required

**Request:**
```json
{
  "password": "mypassword123"
}
```

**Response (Success):**
```json
{
  "verified": true
}
```

**Response (Failure):**
```json
{
  "error": "Invalid password"
}
```

---

## Frontend Usage Examples

### Create Public Share Link

```typescript
import { shareApi } from '@/lib/api/albums';

const createPublicShare = async (albumId: string) => {
  try {
    const response = await shareApi.createShare(albumId, {
      shareType: 'link',
      permissions: {
        canView: true,
        canDownload: true,
        canFavorite: true,
        canComment: false,
      },
      password: 'optional-password',
      expiresAt: '2025-12-31T23:59:59Z',
    });

    const shareUrl = response.shares[0].shareUrl;
    console.log('Share URL:', shareUrl);
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl);
  } catch (error) {
    console.error('Failed to create share:', error);
  }
};
```

### Share with Specific Users

```typescript
const shareWithClients = async (albumId: string) => {
  try {
    const response = await shareApi.createShare(albumId, {
      shareType: 'email',
      emails: [
        { email: 'client1@example.com', name: 'Client Name' },
        { email: 'client2@example.com', name: 'Another Client' },
      ],
      permissions: {
        canView: true,
        canDownload: true,
        canFavorite: false,
        canComment: false,
      },
      expiresAt: '2025-12-31T23:59:59Z',
      message: 'Your photos are ready!',
    });

    console.log(`Shared with ${response.shares.length} users`);
  } catch (error) {
    console.error('Failed to share:', error);
  }
};
```

### Get All Shares

```typescript
const getAlbumShares = async (albumId: string) => {
  try {
    const { publicShare, privateShares, totalShares } = await shareApi.getShares(albumId);
    
    if (publicShare) {
      console.log('Public link:', publicShare.shareUrl);
    }
    
    console.log(`${privateShares.length} private shares`);
  } catch (error) {
    console.error('Failed to get shares:', error);
  }
};
```

### Update Share Settings

```typescript
const updateSharePermissions = async (albumId: string, shareId: string) => {
  try {
    await shareApi.updateShare(albumId, {
      shareId,
      permissions: {
        canDownload: false, // Disable downloads
      },
    });
    
    console.log('Share updated');
  } catch (error) {
    console.error('Failed to update share:', error);
  }
};
```

### Revoke Share

```typescript
const revokeShare = async (albumId: string, shareId: string) => {
  try {
    await shareApi.revokeShare(albumId, shareId);
    console.log('Share revoked');
  } catch (error) {
    console.error('Failed to revoke share:', error);
  }
};
```

### Access Shared Album (Client Side)

```typescript
const viewSharedAlbum = async (token: string, password?: string) => {
  try {
    // First, try to access the album
    const album = await shareApi.accessSharedAlbum(token);
    
    // If password is required and not provided, prompt user
    if (album.requiresPassword && !password) {
      const userPassword = prompt('Enter password:');
      if (userPassword) {
        await shareApi.verifySharePassword(token, userPassword);
        // Retry accessing album after password verification
        return await shareApi.accessSharedAlbum(token);
      }
    }
    
    return album;
  } catch (error) {
    console.error('Failed to access shared album:', error);
  }
};
```

---

## Share Features Summary

### ✅ Implemented Features

1. **Public Link Sharing**
   - Generate unique shareable link
   - Optional password protection
   - Optional expiration date
   - Track views
   - Single public link per album

2. **Private Email Sharing**
   - Share with specific email addresses
   - Unique token per user
   - Track individual user views
   - Per-user expiration dates

3. **Permissions System**
   - View photos
   - Download photos
   - Favorite photos
   - Comment on photos

4. **Security**
   - Bcrypt password hashing
   - Access token validation
   - Expiration checks
   - Owner-only management

5. **Management**
   - Update share settings
   - Revoke specific shares
   - Revoke all shares
   - Track share analytics (views, last viewed)

6. **Photo Access**
   - Presigned S3 URLs (1 hour expiry)
   - Respects share permissions
   - Optimized for performance

### 🔄 Pending Enhancements

1. **Email Notifications** (TODO in code)
   - Send share invitations
   - Notify on new photo uploads
   - Notify on comments

2. **Advanced Analytics**
   - Track photo downloads per share
   - Track favorite photos per share
   - Engagement metrics

3. **Share Templates**
   - Predefined permission sets
   - Quick share presets

---

## Error Codes

- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (not album owner)
- `404` - Not found (album or share doesn't exist)
- `410` - Gone (share link expired)
- `400` - Bad request (validation errors)
- `500` - Server error

---

## Security Considerations

1. **Access Tokens**: 64-character random hex strings
2. **Passwords**: Bcrypt hashed with salt rounds = 10
3. **Expiration**: Server-side validation on every access
4. **S3 URLs**: Presigned with 1-hour expiry
5. **Owner Validation**: All management endpoints require owner authentication
6. **Token Privacy**: Email shares use unique tokens (not guessable)

---

## Testing

Use the following curl commands to test the API:

### Create Public Share
```bash
curl -X POST http://localhost:3000/api/albums/ALBUM_ID/share \
  -H "Content-Type: application/json" \
  -b "token=YOUR_JWT_TOKEN" \
  -d '{
    "shareType": "link",
    "permissions": {
      "canView": true,
      "canDownload": true
    }
  }'
```

### Access Shared Album
```bash
curl http://localhost:3000/api/shared/ACCESS_TOKEN
```

---

This documentation covers the complete share API implementation with both public and private sharing capabilities!
