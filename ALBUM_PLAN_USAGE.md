# Album Plan System - Usage Guide

## Quick Start

### 1. Initialize Album Plans

First, run the initialization script to create the default plans in your database:

```bash
npx tsx scripts/init-album-plans.ts
```

This will create four plans:
- **Basic**: ₹99 (25 GB storage)
- **Standard**: ₹149 (50 GB storage) - Recommended
- **Premium**: ₹199 (100 GB storage)
- **Enterprise**: ₹249 (200 GB storage)

### 2. Using the Components

#### Plan Selector Component

```tsx
import { AlbumPlanSelector } from '@/components/shared/albums/album-plan-selector';

<AlbumPlanSelector
  plans={plans}
  selectedPlanId={selectedPlanId}
  onSelectPlan={setSelectedPlanId}
  userBalance={userBalance}
/>
```

#### Storage Indicator Component

```tsx
import { StorageIndicator } from '@/components/shared/albums/storage-indicator';

// Compact version
<StorageIndicator storageInfo={storageInfo} compact />

// Full version
<StorageIndicator 
  storageInfo={storageInfo} 
  albumTitle="My Wedding Album"
/>
```

#### Complete Form Example

```tsx
import { CreateAlbumWithPlanForm } from '@/components/shared/albums/create-album-with-plan-form';

<CreateAlbumWithPlanForm 
  onSuccess={(album) => {
    console.log('Album created:', album);
    router.push(`/albums/${album._id}`);
  }}
/>
```

### 3. API Endpoints

#### Get All Plans
```typescript
GET /api/album-plans
Response: { success: true, plans: AlbumPlan[] }
```

#### Create Album with Plan
```typescript
POST /api/albums
Body: {
  title: string,
  description?: string,
  planId: string, // Required
  location?: string,
  shootDate?: string
}
Response: { success: true, album: Album, storageInfo: StorageInfo }
```

#### Get Album Storage Info
```typescript
GET /api/albums/[id]/storage
Response: { 
  success: true, 
  storage: StorageInfo,
  album: { id, title, planName, planExpiresAt, isExpired }
}
```

#### Validate File Upload
```typescript
POST /api/albums/[id]/storage/validate
Body: { fileSize: number }
Response: { 
  success: boolean, 
  allowed: boolean,
  error?: string,
  storageInfo?: StorageInfo
}
```

### 4. Storage Tracking

When uploading photos, validate against storage limit:

```typescript
// Before upload
const response = await fetch(`/api/albums/${albumId}/storage/validate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fileSize: file.size })
});

const data = await response.json();

if (!data.allowed) {
  alert(data.error); // "Storage limit exceeded..."
  return;
}

// Proceed with upload
```

After uploading photos, update album storage:

```typescript
import { StorageService } from '@/lib/services/storage.service';

await StorageService.updateAlbumStorage(albumId);
```

### 5. Displaying Storage Info

Fetch and display storage for an album:

```typescript
const response = await fetch(`/api/albums/${albumId}/storage`);
const { storage } = await response.json();

// storage contains:
// - used: number (bytes)
// - limit: number (bytes)
// - remaining: number (bytes)
// - percentage: number (0-100)
// - usedFormatted: string ("45.2 GB")
// - limitFormatted: string ("50 GB")
// - remainingFormatted: string ("4.8 GB")
```

## Key Features

✅ **Four Pricing Tiers**: ₹99, ₹149, ₹199, ₹249
✅ **Storage Limits**: 25GB, 50GB, 100GB, 200GB per album
✅ **Wallet Integration**: Automatic deduction on album creation
✅ **Storage Tracking**: Real-time used/remaining display
✅ **Upload Validation**: Prevents exceeding storage limits
✅ **Auto-Expiry**: Albums deleted after 1 year
✅ **Visual Indicators**: Color-coded progress bars and warnings

## Notes

- Storage is tracked per album (not per user)
- Each album has its own storage limit based on selected plan
- Albums are automatically deleted 1 year after creation
- Wallet balance is checked before album creation
- Storage warnings appear at 70% (yellow) and 90% (red) usage
