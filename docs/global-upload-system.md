# Global Upload System - Technical Documentation

## Overview

The global upload system allows photo uploads to continue in the background even when the user navigates away from the album page. It also supports resuming uploads after a page refresh by storing pending files in IndexedDB.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐        ┌─────────────────────────────────────┐    │
│  │   Album Page    │        │        GlobalUploadPanel            │    │
│  │                 │        │   (Floating UI in bottom-right)     │    │
│  │  - Drag & Drop  │        │                                     │    │
│  │  - File Select  │        │   Shows all uploads grouped         │    │
│  └────────┬────────┘        │   by album with progress bars       │    │
│           │                 └──────────────────┬──────────────────┘    │
│           │                                    │                        │
│           │  addFiles()                        │  subscribes to         │
│           ▼                                    ▼                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    GlobalUploadManager                          │   │
│  │                      (Singleton)                                │   │
│  │                                                                 │   │
│  │  - Manages upload queue                                         │   │
│  │  - Processes 3 uploads concurrently                             │   │
│  │  - Handles retries (max 3)                                      │   │
│  │  - Updates store on progress/success/error                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              │ updates                                  │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     useUploadStore                              │   │
│  │                  (Zustand Global State)                         │   │
│  │                                                                 │   │
│  │  State:                     Actions:                            │   │
│  │  - tasks[]                  - addTasks()                        │   │
│  │  - isProcessing             - updateTaskProgress()              │   │
│  │  - isPanelOpen              - updateTaskStatus()                │   │
│  │  - expandedAlbums           - setTaskSuccess()                  │   │
│  │                             - cancelTask()                      │   │
│  │                             - retryTask()                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              │ persists files                           │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       IndexedDB                                 │   │
│  │                    (upload-db.ts)                               │   │
│  │                                                                 │   │
│  │  files table:              tasks table:                         │   │
│  │  - taskId (key)            - taskId (key)                       │   │
│  │  - albumId                 - albumId                            │   │
│  │  - file (Blob)             - fileName                           │   │
│  │  - createdAt               - status                             │   │
│  │                            - progress                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
lib/
├── services/
│   ├── upload-db.ts           # IndexedDB storage operations
│   └── global-upload-manager.ts   # Singleton upload processor
├── store/
│   └── upload.ts              # Zustand global state

components/
└── shared/
    └── uploads/
        └── GlobalUploadPanel.tsx  # Floating UI component

app/
└── (protected)/
    └── layout.tsx             # Includes GlobalUploadPanel
```

---

## Component Details

### 1. IndexedDB Storage (`upload-db.ts`)

**Purpose:** Persist files and task metadata so uploads can resume after page refresh.

**Database Schema:**
```typescript
// Database: "upload-queue-db"

// Table: "files"
{
  taskId: string,      // Primary key
  albumId: string,     // Index
  albumTitle: string,
  file: File,          // The actual file blob
  createdAt: number
}

// Table: "tasks"
{
  taskId: string,      // Primary key
  albumId: string,     // Index
  albumTitle: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  status: 'pending' | 'uploading' | 'paused' | 'error',
  progress: number,
  error?: string,
  retryCount: number,
  createdAt: number
}
```

**Key Functions:**
| Function | Description |
|----------|-------------|
| `saveUploadTask()` | Saves file and metadata when user selects files |
| `getFile()` | Retrieves file blob for upload |
| `updateTaskStatus()` | Updates progress/status during upload |
| `deleteUploadTask()` | Removes after successful upload |
| `getAllPendingTasks()` | Gets incomplete tasks on app load |

---

### 2. Zustand Store (`upload.ts`)

**Purpose:** Global state management for all upload tasks, accessible from any component.

**State:**
```typescript
interface UploadStore {
  // Core state
  tasks: UploadTask[];           // All upload tasks
  isProcessing: boolean;         // Queue is active
  
  // UI state
  isPanelOpen: boolean;          // Panel visible
  isPanelMinimized: boolean;     // Panel collapsed to badge
  expandedAlbums: Set<string>;   // Which albums are expanded
}
```

**Task Interface:**
```typescript
interface UploadTask {
  id: string;
  albumId: string;
  albumTitle: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'cancelled' | 'paused';
  progress: number;       // 0-100
  error?: string;
  retryCount: number;
  photo?: Photo;          // Set on success
  createdAt: number;
}
```

**Key Actions:**
| Action | Description |
|--------|-------------|
| `addTasks()` | Adds files to queue, saves to IndexedDB |
| `updateTaskProgress()` | Called during upload with % |
| `setTaskSuccess()` | Marks complete, stores Photo, removes from DB |
| `cancelTask()` | Aborts upload, removes from DB |
| `retryTask()` | Resets failed task to pending |
| `restoreFromDB()` | Loads pending tasks on app init |
| `getAlbumGroups()` | Groups tasks by album for UI |

---

### 3. GlobalUploadManager (`global-upload-manager.ts`)

**Purpose:** Singleton that processes the upload queue in the background.

**Key Concepts:**

**Singleton Pattern:**
```typescript
class GlobalUploadManager {
  private static instance: GlobalUploadManager | null = null;
  
  static getInstance(): GlobalUploadManager {
    if (!GlobalUploadManager.instance) {
      GlobalUploadManager.instance = new GlobalUploadManager();
    }
    return GlobalUploadManager.instance;
  }
}

// Usage anywhere:
const manager = getUploadManager();
```

**Concurrent Uploads:**
- Maximum 3 uploads at once (`maxConcurrent = 3`)
- New uploads start automatically when slots open
- Each upload has its own `AbortController` for cancellation

**Upload Flow per File:**
```
1. Get pre-signed URL from backend     (10%)
2. Upload to S3                        (30%)
3. Get image dimensions                (70%)
4. Calculate MD5 hash                  (80%)
5. Create photo record in database     (100%)
```

**Retry Logic:**
- Failed uploads retry up to 3 times
- Task status goes back to 'pending' for retry
- After 3 failures, status becomes 'error'

---

### 4. GlobalUploadPanel (`GlobalUploadPanel.tsx`)

**Purpose:** Floating UI component showing upload progress.

**States:**

| State | Display |
|-------|---------|
| Normal | Full panel with all albums and files |
| Minimized | Small circular button with badge count |
| Hidden | No tasks, not rendered |

**Features:**
- Albums are collapsible (expand/collapse)
- Per-file progress bars
- Cancel individual files or entire album
- Retry failed uploads
- Clear completed uploads
- Link to view album

---

## Data Flow

### Adding Files to Upload

```
User drags files to Album Page
         │
         ▼
Album Page calls: getUploadManager().addFiles(files, albumId, albumTitle)
         │
         ▼
GlobalUploadManager.addFiles():
    1. Gets store: useUploadStore.getState()
    2. Calls store.addTasks() which:
       - Creates UploadTask objects
       - Saves files to IndexedDB
       - Adds tasks to store state
       - Opens the upload panel
    3. Calls this.startProcessing()
         │
         ▼
processQueue() loop:
    - Gets pending tasks from store
    - Starts up to 3 concurrent uploads
    - Each upload calls uploadTask()
         │
         ▼
uploadTask():
    1. store.updateTaskStatus('uploading')
    2. Get file from IndexedDB
    3. Get pre-signed URL
    4. Upload to S3
    5. Get dimensions
    6. Calculate MD5
    7. Create photo in backend
    8. store.setTaskSuccess(photo)
    9. Delete from IndexedDB
```

### Resume After Refresh

```
App loads → Protected Layout mounts
         │
         ▼
GlobalUploadPanel mounts → calls getUploadManager()
         │
         ▼
GlobalUploadManager constructor runs:
    - Calls restoreAndResume()
         │
         ▼
restoreAndResume():
    1. store.restoreFromDB()
       - Reads all pending tasks from IndexedDB
       - Adds them to store state
    2. Checks if pending tasks exist
    3. If yes, calls startProcessing()
         │
         ▼
Queue resumes where it left off
```

---

## Integration Points

### Album Page (`albums/[id]/page.tsx`)

The album page uses the global upload system instead of local state:

```typescript
// Old way (removed):
const uploadServiceRef = useRef<UploadService | null>(null);
uploadServiceRef.current.addToQueue(files, albumId);

// New way:
import { getUploadManager } from '@/lib/services/global-upload-manager';

const uploadFiles = async (files: File[]) => {
  const uploadManager = getUploadManager();
  await uploadManager.addFiles(files, albumId, album.title);
};
```

The album page also subscribes to the store to add successful photos to the gallery:

```typescript
useEffect(() => {
  const unsubscribe = useUploadStore.subscribe((state, prevState) => {
    // Check for newly successful uploads in this album
    const albumTasks = state.tasks.filter(t => t.albumId === albumId);
    
    albumTasks.forEach(task => {
      if (task.status === 'success' && task.photo) {
        setPhotos(prev => [task.photo, ...prev]);
      }
    });
  });
  
  return () => unsubscribe();
}, [albumId]);
```

### Protected Layout (`layout.tsx`)

The GlobalUploadPanel is added to the protected layout so it's visible on all pages:

```typescript
import { GlobalUploadPanel } from '@/components/shared/uploads/GlobalUploadPanel';

export default function ProtectedLayout({ children }) {
  return (
    <AppLayout>
      {children}
      <GlobalUploadPanel />  {/* Always present */}
    </AppLayout>
  );
}
```

---

## Key Benefits

| Benefit | How It Works |
|---------|--------------|
| **Uploads survive navigation** | Singleton manager stays alive, not tied to any component |
| **Resume after refresh** | Files stored in IndexedDB, restored on app load |
| **Multi-album parallel uploads** | Queue supports any albumId, groups in UI |
| **Visibility** | Floating panel shows progress on any page |
| **Cancel/Retry** | Each task has AbortController, status tracking |
