# User Flow Diagrams - Photography Album System

## Photographer Workflows

### Flow 1: Create and Share Album

```
START
  |
  v
Dashboard
  |
  +---- [+ New Album]
  |
  v
Album Form
  ├─ Enter Title
  ├─ Enter Description
  ├─ Set Date
  ├─ Set Location
  └─ Select Privacy
  |
  v
[Create Album]
  |
  v
Photo Upload Screen
  ├─ Drag-drop photos
  ├─ Select from browser
  └─ View upload progress
  |
  v
[Upload Photos]
  |
  v
Album Manager
  ├─ View all photos
  ├─ Reorder (drag-drop)
  ├─ Set cover photo
  └─ Delete unwanted
  |
  v
[Share Button]
  |
  v
Share Modal
  ├─ Enable/disable downloads
  ├─ Enable/disable favorites
  ├─ Add password (opt)
  └─ Set expiration (opt)
  |
  v
[Generate Share Link]
  |
  v
Success Screen
  ├─ Copy link
  ├─ View QR code
  └─ Share configuration
  |
  v
[Close]
  |
  v
END (Album shared)
```

### Flow 2: Edit Existing Album

```
START
  |
  v
Dashboard
  |
  +---- [Album Card]
  |         |
  |         v
  |      Card Menu (⋮)
  |         |
  |         +---- [Edit]
  |         |
  |         v
  |      Album Manager
  |         ├─ Reorder photos
  |         ├─ Set cover
  |         ├─ Delete photos
  |         └─ Upload more
  |         |
  |         v
  |      [Save Changes]
  |         |
  |         v
  |      Success notification
  |
  v
END
```

### Flow 3: Delete Album

```
START
  |
  v
Dashboard
  |
  +---- Album Card Menu (⋮)
  |         |
  |         +---- [Delete]
  |         |
  |         v
  |      Confirmation Dialog
  |         "Delete album and all photos?"
  |         |
  |         +---- [Cancel] → Back to Dashboard
  |         |
  |         +---- [Delete] ↓
  |
  v
Processing...
  |
  v
Album deleted
  |
  v
Success message
  |
  v
Dashboard (album removed)
  |
  v
END
```

---

## Client Workflows

### Flow 1: Access Password-Protected Album

```
START
  |
  v
Click Share Link
  |
  v
Loading Screen
  |
  v
Password Required Screen
  ├─ Album title displayed
  ├─ Password field
  └─ Access button
  |
  v
Enter Password
  |
  v
[Access Album]
  |
  v
Authentication Processing
  |
  ├─ Valid ✓
  |  |
  |  v
  |  Gallery View (Grid)
  |  |
  |  v
  |  View Photos
  |
  ├─ Invalid ✗
  |  |
  |  v
  |  Error message
  |  "Incorrect password"
  |  |
  |  +---- [Try Again] → Back to password screen
  |
  v
Gallery View (success)
  |
  v
END
```

### Flow 2: Browse & Download Photos

```
START
  |
  v
Gallery View (Grid)
  ├─ View thumbnails
  ├─ Toggle Grid/List view
  ├─ Scroll through photos
  └─ [Download All]
  |
  ├─ [Click Photo Thumbnail]
  |  |
  |  v
  |  Full-Screen Viewer
  |  ├─ View full resolution
  |  ├─ Navigation arrows
  |  ├─ Favorite button (if enabled)
  |  ├─ Download button (if enabled)
  |  └─ Info panel (toggle)
  |  |
  |  +---- [❤ Favorite] → Photo marked
  |  |
  |  +---- [⬇ Download] → File downloads
  |  |
  |  +---- [← →] → Navigate photos
  |  |
  |  +---- [X] → Close viewer
  |
  v
Back to Gallery
  |
  v
END
```

### Flow 3: Mark Favorites

```
START
  |
  v
Gallery View
  (Favorites enabled by photographer)
  |
  v
Select View Mode (Grid/List)
  |
  v
[Hover Photo] OR [Click to expand viewer]
  |
  v
See Favorite Button (♡)
  |
  v
[Click Favorite Button]
  |
  v
Heart Filled (♥)
  |
  v
Photo added to favorites
  (Local/session storage)
  |
  v
Can view favorites collection or
continue browsing
  |
  v
END
```

---

## Information Architecture

### Photographer Site Map

```
Root (/)
├── Photographer Dashboard (/photographer)
│   ├── Albums List (Grid View)
│   ├── Album Card Actions
│   │   ├── Edit Album → Album Editor
│   │   ├── Share Album → Share Modal
│   │   └── Delete Album → Confirmation
│   └── [+ New Album] Button
│
├── Create Album (/photographer/albums/new)
│   ├── Album Form
│   │   ├── Title Input
│   │   ├── Description Textarea
│   │   ├── Date Picker
│   │   ├── Location Input
│   │   └── Privacy Selector
│   └── Photo Upload
│       ├── Drag-drop Zone
│       ├── File Browser
│       └── Upload Queue
│
├── Album Manager (/photographer/albums/[id])
│   ├── Album Details
│   ├── Photo Grid (reorderable)
│   ├── Photo Actions
│   │   ├── Set Cover
│   │   └── Delete
│   ├── [Share Button]
│   └── [Upload More]
│
└── Share Settings Modal
    ├── Configuration Options
    ├── Link Generator
    └── QR Code Display
```

### Client Site Map

```
Root (/)
├── Gallery Access (/gallery/[token])
│   ├── Password Screen (if protected)
│   │   └── [Access Album] → Gallery
│   │
│   ├── Gallery View (/gallery/[token])
│   │   ├── Navigation
│   │   │   └── Breadcrumbs
│   │   ├── Album Info Display
│   │   ├── View Controls
│   │   │   ├── Grid/List Toggle
│   │   │   └── [Download All] (if enabled)
│   │   └── Photo Grid
│   │       └── [Click Photo]
│   │
│   └── Photo Viewer Modal (/gallery/[token]#[photoId])
│       ├── Full-Screen Image
│       ├── Navigation (← →)
│       ├── Controls
│       │   ├── [❤ Favorite] (if enabled)
│       │   ├── [⬇ Download] (if enabled)
│       │   └── [ℹ Info Toggle]
│       └── [X Close]
│
└── Favorites Collection (session-based)
    └── View marked photos
```

---

## User Decision Trees

### Photographer Decision Tree

```
"I want to..."

├─ Create a new album
│  ├─ Yes → Go to New Album page
│  │        Fill form → Upload photos
│  │
│  └─ No → Continue

├─ Share an album
│  ├─ Public access → Set Privacy = Public
│  ├─ Password protected → Add password
│  │                      Share link
│  ├─ Private only → Set Privacy = Private
│  │                Don't share
│  └─ Control downloads → Uncheck "Allow Downloads"

├─ Edit photos in album
│  ├─ Reorder → Drag photos
│  ├─ Delete → Click delete icon
│  ├─ Set cover → Click "Set Cover"
│  └─ Upload more → Click "Upload More"

└─ Manage existing albums
   ├─ Edit → Open album editor
   ├─ Share → Open share modal
   └─ Delete → Confirm deletion
```

### Client Decision Tree

```
"I want to..."

├─ View the album
│  ├─ Password required?
│  │  ├─ Yes → Enter password
│  │  └─ No → Go to gallery
│  │
│  └─ Gallery loads → Choose view mode

├─ Browse photos
│  ├─ Grid view → Scroll thumbnails
│  ├─ List view → See details
│  └─ Click to enlarge → Full-screen viewer

├─ Mark favorites
│  ├─ Feature enabled?
│  │  ├─ Yes → Click ❤ button
│  │  └─ No → Feature unavailable
│  │
│  └─ Photo marked locally

├─ Download photos
│  ├─ Feature enabled?
│  │  ├─ Yes → Click ⬇ button
│  │  └─ No → Feature unavailable
│  │
│  └─ File downloads

└─ View photo info
   ├─ Click ℹ icon
   ├─ See metadata:
   │  ├─ Upload date
   │  ├─ File size
   │  └─ Dimensions
   └─ Click to close
```

---

## Interaction Paths - Mobile Specific

### Mobile Photographer Flow

```
START (Mobile Dashboard)
  |
  v
Hamburger Menu (☰) → Expand Sidebar
  |
  v
"Albums" → Gallery List
  |
  v
[+ New Album] (Sticky bottom button)
  |
  v
Album Form (Full screen)
  ├─ Scroll to see all fields
  ├─ Phone keyboard opens inputs
  └─ [Create Album] button
  |
  v
Upload Photos (Full screen)
  ├─ Tap drag-drop zone
  ├─ Camera/Gallery picker opens
  ├─ Select photos (multi-select)
  └─ [Upload]
  |
  v
Photo Confirmation
  |
  v
Album Manager (Full screen)
  ├─ Photos in vertical stack
  ├─ Long-tap to reorder (drag)
  ├─ Swipe options for delete/cover
  └─ Back button
  |
  v
END (Album created)
```

### Mobile Client Flow

```
START (Click share link)
  |
  v
Loading Screen
  |
  v
Password Screen (if needed)
  ├─ Full viewport
  ├─ Large password input
  └─ Prominent button
  |
  v
Gallery View (Full screen)
  ├─ Photos in 2-column grid
  ├─ Vertical scroll
  ├─ Toggle buttons (top-right corner)
  └─ [Download All] button
  |
  v
Tap Photo
  |
  v
Full-Screen Viewer
  ├─ Photo fills screen
  ├─ Swipe ← → to navigate
  ├─ Buttons at bottom (fixed)
  │  ├─ Favorite (heart)
  │  ├─ Download (arrow)
  │  └─ Info (i)
  └─ Close (X) top-right
  |
  v
Info Panel (if tapped)
  ├─ Slides up from bottom
  ├─ Photo metadata
  └─ Tap outside to close
  |
  v
END
```

---

## Error Handling Flows

### Upload Error Recovery

```
Upload Started
  |
  v
Processing...
  |
  ├─ Success ✓
  |  |
  |  v
  |  ✓ Green checkmark
  |  Photo confirmed
  |
  ├─ Connection Lost ✗
  |  |
  |  v
  |  ⚠ Error: "Connection lost"
  |  [Retry] or [Skip]
  |     |
  |     +---- [Retry] → Upload again
  |     |
  |     +---- [Skip] → Next photo
  |
  └─ File Invalid ✗
     |
     v
     ⚠ Error: "Invalid file format"
     "Please use JPG, PNG, or WEBP"
     [Remove]
        |
        v
     Photo removed from queue
     [Upload Remaining]
```

### Gallery Loading Error

```
Click Share Link
  |
  v
Loading...
  |
  ├─ Success ✓
  |  |
  |  v
  |  Gallery loads
  |
  ├─ Expired Link ✗
  |  |
  |  v
  |  Error: "Album link expired"
  |  "This share link is no longer valid"
  |  Contact photographer for new link
  |
  └─ Not Found ✗
     |
     v
     Error: "Album not found"
     "This album may have been deleted"
```

---

## State Management Flows

### Client Gallery State

```
Initial Load
  ↓
Loading State
  ├─ Show skeleton cards
  └─ Disable interactions
  ↓
Photos Loaded
  ├─ Render gallery grid
  ├─ Ready for interaction
  └─ Favorites: empty set
  ↓
User Interactions
  ├─ Select photo
  │  └─ Open full-screen viewer
  ├─ Toggle favorite
  │  └─ Update favorites set
  ├─ Download
  │  └─ Trigger download
  └─ Change view
     └─ Switch grid/list layout
  ↓
Continue browsing...
```

### Share Configuration State

```
Modal Opens
  ↓
Default Settings
  ├─ allow_download: true
  ├─ allow_favorites: false
  ├─ password: empty
  └─ expires_at: empty
  ↓
User Adjusts Settings
  ├─ Toggle checkboxes
  ├─ Enter password (optional)
  └─ Set expiration (optional)
  ↓
[Generate Share Link]
  ↓
API Request Processing
  ├─ Validate settings
  ├─ Create share record
  └─ Generate unique token
  ↓
Success Response
  ├─ Display share link
  ├─ Show QR code
  ├─ Copy to clipboard
  └─ Show configuration summary
```

---

## Accessibility User Flows

### Keyboard-Only Navigation

```
Tab Navigation Order:
1. Header Menu → Skip to Main
2. New Album Button
3. Album Cards (Tab through each)
4. Card Actions (⋮) → Dropdown (Enter to open)
5. Modal (Escape to close)
6. Form Fields (Tab through)
7. Submit Button (Enter to activate)
```

### Screen Reader Flow

```
Page Load
  ↓
"Photography Dashboard, Photographer area"
  ↓
"Main content region"
  ↓
"Albums list, 3 albums"
  ↓
"Album card: Summer Wedding 2024"
  ├─ "Cover image"
  ├─ "Title: Summer Wedding 2024"
  ├─ "248 photos, Password protected"
  └─ "Actions menu button"
  ↓
"Next: Album card: Corporate Event"
```

### Motion-Safe Navigation

```
If user prefers reduced motion:
  ├─ Disable hover animations
  ├─ Remove transitions
  ├─ Keep opacity changes only
  ├─ No parallax effects
  └─ No auto-playing animations
```

---

## Performance Optimization Flows

### Lazy Loading Strategy

```
Page Load
  ↓
Load critical content
  ├─ Header
  ├─ Navigation
  └─ Above-fold album cards
  ↓
Show skeleton cards
  ↓
Batch load remaining albums
  (Infinite scroll or pagination)
  ↓
Lazy load thumbnails
  ├─ Intersection Observer
  ├─ Load on viewport visibility
  └─ Cache for reuse
  ↓
On-demand full resolution
  ├─ Load when opening viewer
  └─ Cache for navigation
```

---

## Conclusion

These user flows and diagrams provide comprehensive guidance for implementing and testing the photography album management system. They account for both happy paths and edge cases, ensuring a robust and user-friendly experience for photographers and clients alike.

