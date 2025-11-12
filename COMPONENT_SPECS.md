# Component Specifications - Photography Album System

## Overview

This document details all interactive components built for the photography album management system, including their props, states, and accessibility features.

---

## Core Components

### 1. AlbumCard

**Purpose:** Display individual album as a card in grid layout

**Props:**
```typescript
interface AlbumCardProps {
  album: Album
  onEdit?: (album: Album) => void
  onShare?: (album: Album) => void
  onDelete?: (albumId: string) => void
}
```

**Visual Structure:**
```
┌─ AlbumCard ─────────────────────┐
│ ┌─ Cover Image (16:9) ────────┐ │
│ │ Hover Overlay: [Edit Button] │ │
│ └──────────────────────────────┘ │
│ Title (truncated, 1 line)        │
│ Description (2 lines max)        │
│ [⋮] Menu  Privacy | Photo Count  │
└──────────────────────────────────┘
```

**States:**
- Default: Card with shadow
- Hover: Increased shadow, edit button visible
- Disabled: Reduced opacity

**Dropdown Menu Items:**
- Share
- Edit
- Delete (destructive)

**Accessibility:**
- Semantic card structure
- Title changes on focus
- Menu keyboard navigable
- Sufficient color contrast

---

### 2. PhotoGrid

**Purpose:** Display photos in grid or list layout with selection/actions

**Props:**
```typescript
interface PhotoGridProps {
  photos: Photo[]
  showSelection?: boolean
  selectedPhotos?: Set<string>
  onSelectPhoto?: (photoId: string) => void
  onSelectAll?: (selected: boolean) => void
  showFavorites?: boolean
  favorites?: Set<string>
  onFavorite?: (photoId: string) => void
  onDelete?: (photoId: string) => void
  viewMode?: 'grid' | 'list'
  onPhotoClick?: (photo: Photo) => void
}
```

**Grid View:**
```
┌──────┬──────┬──────┬──────┬──────┐
│ [1]  │ [2]  │ [3]  │ [4]  │ [5]  │
│ 📸   │ 📸   │ 📸   │ 📸   │ 📸   │
│ ❤    │ ❤    │ ❤    │ ❤    │ ❤    │
│ (on hover: ❤, 🗑)                │
└──────┴──────┴──────┴──────┴──────┘
```

**List View:**
```
┌─ Checkbox ─ Thumbnail ─ Details ─ Actions ─┐
│ ☑ │ 📸 │ Photo date │ Size: 2.04 MB │ ❤ 🗑 │
│ ☑ │ 📸 │ Photo date │ Size: 1.85 MB │ ❤ 🗑 │
│ ☑ │ 📸 │ Photo date │ Size: 1.92 MB │ ❤ 🗑 │
└────────────────────────────────────────────┘
```

**Interactions:**
- Click photo: Open full-screen viewer
- Click checkbox: Select/deselect
- Click heart: Toggle favorite
- Click delete: Remove photo
- Drag (grid, admin): Reorder

**States:**
- Selected: Checkbox visible, highlight color
- Favorited: Heart filled, red color
- Hover: Show action buttons, dim image

---

### 3. AlbumForm

**Purpose:** Collect metadata for album creation/editing

**Props:**
```typescript
interface AlbumFormProps {
  album?: Album
  onSubmit: (data: Partial<Album>) => Promise<void>
  isLoading?: boolean
}
```

**Form Fields:**
```
Album Title: [________________________]
Description: [________________________]
             [________________________]

Photo Date: [__________] Location: [__________]

Privacy Setting: [Dropdown ▼]
                ├─ Private (Only me)
                ├─ Password Protected
                └─ Public

[Create Album]  [Cancel]
```

**Validation:**
- Title: Required, 3-100 chars
- Description: Optional, max 500 chars
- Date: Optional, valid date format
- Location: Optional, max 200 chars

**Loading State:**
- Button shows spinner, disabled
- Form inputs disabled
- Loading text: "Creating album..." or "Updating..."

**Error Handling:**
- Validation errors shown inline
- API errors in alert banner
- Clear error messages

---

### 4. PhotoUploader

**Purpose:** Handle batch file upload with drag-and-drop

**Props:**
```typescript
interface PhotoUploaderProps {
  onUpload: (files: File[]) => Promise<void>
  isLoading?: boolean
}
```

**Visual Structure:**
```
┌─ Drag-Drop Zone ─────────────────┐
│         ⬆️ Upload Icon           │
│ Drop photos here or click         │
│ Supports JPG, PNG, WEBP           │
│       [📁 Select Files]           │
└───────────────────────────────────┘

5 Uploaded • 3 Pending

┌─ Photo List ──────────────────────┐
│ 📸 photo1.jpg ✓ Uploaded       [×]│
│ 📸 photo2.jpg ✓ Uploaded       [×]│
│ 📸 photo3.jpg [████░░] 50%    [×]│
│ 📸 photo4.jpg ⚠ Error       [×]│
│ 📸 photo5.jpg ⏳ Pending     [×]│
└───────────────────────────────────┘

[Upload 3 Photos]
```

**Interactions:**
- Drag files: Enter drag state (visual feedback)
- Drop files: Add to queue, filter images
- Click zone: Open file picker
- Preview: Show thumbnail for each file
- Remove: Delete from queue before upload
- Upload: Submit queued files

**File States:**
- Pending: Gray, remove button visible
- Uploading: Progress bar, disabled remove
- Complete: Green checkmark
- Error: Red warning, retry option

**Accessibility:**
- Large drop zone (44px minimum)
- Keyboard accessible file input
- Clear file size display
- Error messages descriptive

---

### 5. ShareModal

**Purpose:** Configure and generate share links with security options

**Props:**
```typescript
interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  albumId: string
  share?: Share
  onCreateShare?: (config: ShareConfig) => Promise<Share>
  isLoading?: boolean
}
```

**Initial State (Configuration):**
```
┌─ Share Album ──────────────────┐
│                                │
│ SHARE SETTINGS:                │
│ ☑ Allow Downloads              │
│ ☐ Allow Favorites              │
│                                │
│ OPTIONAL:                      │
│ Password: [________________]    │
│ Expires: [____] [__:__]        │
│                                │
│ [Generate Share Link] [Cancel] │
└────────────────────────────────┘
```

**Success State (Results):**
```
┌─ Share Album ──────────────────┐
│ ✓ Share link created!          │
│                                │
│ URL: [gallery/.../abc123] [📋] │
│                                │
│ Configuration:                 │
│ Downloads: ✓ Yes               │
│ Favorites: ✗ No                │
│ Password: ✓ Protected          │
│ Expires: July 31, 2024         │
│                                │
│ [QR Code Display]              │
│                                │
│ [Close]                        │
└────────────────────────────────┘
```

**Interactions:**
- Toggle checkboxes: Enable/disable features
- Text inputs: Add password, set expiration
- Generate: Create share configuration
- Copy button: Copy URL to clipboard
- Show success message: 3 second feedback

**Validation:**
- Password optional, no length minimum (future: enforce strength)
- Expiration optional, must be future date
- At least one permission must be enabled (download or view)

---

### 6. PhotoViewer

**Purpose:** Full-screen photo viewing with navigation and actions

**Props:**
```typescript
interface PhotoViewerProps {
  photos: Photo[]
  initialPhotoId: string
  isOpen: boolean
  onClose: () => void
  showFavorites?: boolean
  isFavorite?: boolean
  onFavorite?: (photoId: string) => void
  canDownload?: boolean
  onDownload?: (photo: Photo) => void
}
```

**Layout:**
```
┌─ Full Screen Viewer ─────────────────┐
│ X (top-right)   Photo 3/248 (top-left)
│                                       │
│         [◄]  [        PHOTO      ] [►]
│         (prev)  [Full Resolution]  (next)
│                                       │
│ [❤] [ℹ Info] ────────────────── [⬇]│
│                                       │
└─ Info Panel (expanded) ──────────────┐
│ Uploaded: July 15, 2024             │
│ Size: 2.04 MB                       │
│ Dimensions: 1920 x 1280             │
└─────────────────────────────────────┘
```

**Interactions:**
- ← → buttons: Navigate between photos
- Keyboard arrows: Navigate (Arrow Left/Right)
- Escape key: Close viewer
- Click photo: Dismiss info panel
- Heart button: Toggle favorite (if enabled)
- Download button: Save photo (if enabled)
- Info button: Toggle metadata display

**States:**
- First photo: Previous button disabled
- Last photo: Next button disabled
- Favorite marked: Heart filled red
- Loading: Show spinner while loading high-res

**Dark Theme:**
- Background: Black/95% opacity
- Controls: White icons on dark
- Info panel: Semi-transparent background

---

### 7. GalleryView

**Purpose:** Album gallery with view toggle and batch actions

**Props:**
```typescript
interface GalleryViewProps {
  photos: Photo[]
  canDownload?: boolean
  canFavorite?: boolean
  onDownload?: (photoId: string) => void
  onFavorite?: (photoId: string) => void
  favorites?: Set<string>
}
```

**Layout:**
```
248 photos  [⊞ Grid] [≡ List] [⬇ Download All]

┌──────┬──────┬──────┬──────┬──────┐
│ [1]  │ [2]  │ [3]  │ [4]  │ [5]  │
└──────┴──────┴──────┴──────┴──────┘
```

**Features:**
- View mode toggle: Grid ↔ List
- Photo count display
- Download all button (when enabled)
- Grid/list switching smooth
- Responsive column counts

---

## Form Components

### 8. Input Components

**Standard Input:**
```
[Text Input Field]
```

**Features:**
- Placeholder text
- Disabled state (grayed out)
- Error state (red border)
- Required indicator
- Focus state (blue border, shadow)

### 9. Select/Dropdown

```
[Privacy Setting ▼]
├─ Private (Only me)
├─ Password Protected
└─ Public
```

**Features:**
- Arrow indicator
- Keyboard navigation (Arrow keys)
- Keyboard selection (Enter)
- Disabled state

### 10. Checkbox

```
☑ Allow Downloads
☐ Allow Favorites
```

**Features:**
- Checked/unchecked states
- Focus indicator
- Keyboard toggle (Space)
- Label clickable

---

## Layout Components

### 11. Card

**Structure:**
```
┌─ Card ─────────────────────────┐
│ ┌─ Header ─────────────────────┐│
│ │ Title                        ││
│ │ Description (optional)       ││
│ └──────────────────────────────┘│
│ ┌─ Content ────────────────────┐│
│ │ Card body content            ││
│ └──────────────────────────────┘│
└────────────────────────────────┘
```

**Styling:**
- White background
- Rounded corners (8px)
- Subtle shadow
- Padding: 24px

### 12. Dialog/Modal

**Properties:**
- Centered on screen
- Backdrop: 50% black overlay
- Max width: 600px (desktop), 100% mobile
- Dismiss: X button, Escape key, backdrop click
- Focus trap: Keyboard focus stays inside

---

## Responsive Behavior

### Breakpoints

**Mobile (< 640px):**
- Album grid: 1 column
- Photo grid: 2 columns
- Forms: Single column
- Modals: Full width minus padding
- Buttons: Full width for primary actions

**Tablet (640px - 1024px):**
- Album grid: 2 columns
- Photo grid: 3 columns
- Forms: Still single column
- Sidebar narrower but visible
- Modals: 90% width

**Desktop (> 1024px):**
- Album grid: 3 columns
- Photo grid: 5 columns
- Forms: 2 columns
- Full sidebar
- Modals: 600px width

### Touch Interactions

**Mobile:**
- Touch targets: 44px minimum
- Horizontal swipe: Navigate photos
- Vertical scroll: Gallery browsing
- Long-press: Context menu
- Double-tap: Zoom image

---

## Accessibility Features

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Text: 4.5:1 ratio
- UI components: 3:1 ratio
- Focus indicators: 2px outline

**Keyboard Navigation:**
- Tab order logical
- Enter/Space activate controls
- Escape closes overlays
- Arrow keys navigate galleries

**Screen Reader Support:**
- Semantic HTML
- ARIA labels for icons
- Form labels associated
- Live regions for updates
- Image alt text descriptive

**Motor Control:**
- Click/tap targets 44px+
- Alternatives to drag-drop
- Extended timeouts available
- Simplified interactions option

---

## Error & Loading States

### Loading States

**Global:**
- Page skeleton: Gray placeholder cards
- Spinner: Centered, 20px diameter
- Duration: Show after 300ms
- Message: "Loading..."

**Component:**
- Button spinner: Inside button
- Input disabled: Grayed out
- "Loading..." text visible
- No interaction possible

### Error States

**Alert Banner:**
```
⚠ Error message here
[Dismiss] [Retry]
```

**Form Field:**
```
[Invalid Input]
Error: Please enter valid email
```

**Connection Error:**
```
Connection Lost
Check your internet and try again
[Retry]
```

---

## Animation Guidelines

### Transitions

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Page load | Fade in | 200ms | ease-out |
| Modal open | Scale + fade | 300ms | ease-out |
| Button hover | Scale 1.02 | 150ms | ease-out |
| Photo hover | Brightness | 200ms | ease-out |
| Favorite toggle | Bounce | 300ms | ease-out |
| Loading spinner | Rotate | Loop | linear |

### No Motion Preference

If user has `prefers-reduced-motion: reduce`:
- Disable all animations
- Use instant transitions
- Keep opacity changes only
- No auto-playing effects

---

## Testing Checklist

### Component Behavior
- [ ] Component renders with default props
- [ ] All props are correctly applied
- [ ] Callbacks fire on interactions
- [ ] Component handles missing data gracefully
- [ ] Error states display correctly
- [ ] Loading states are visible
- [ ] Success states provide feedback

### Responsiveness
- [ ] Mobile layout (375px width)
- [ ] Tablet layout (768px width)
- [ ] Desktop layout (1920px width)
- [ ] No horizontal scrolling on mobile
- [ ] Text readable at all sizes
- [ ] Touch targets 44px+ on mobile

### Accessibility
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast sufficient
- [ ] Screen reader announces content
- [ ] Form labels associated
- [ ] Error messages descriptive
- [ ] No color-only information

### Performance
- [ ] Component renders in <100ms
- [ ] Interactions feel responsive (<200ms)
- [ ] No memory leaks on unmount
- [ ] Images load lazily
- [ ] No unnecessary re-renders

---

## Usage Examples

### AlbumCard Example
```tsx
<AlbumCard
  album={album}
  onEdit={(album) => navigate(`/edit/${album.id}`)}
  onShare={(album) => openShareModal(album)}
  onDelete={(id) => deleteAlbum(id)}
/>
```

### PhotoGrid Example
```tsx
<PhotoGrid
  photos={photos}
  viewMode="grid"
  showFavorites={true}
  favorites={favorites}
  onFavorite={handleFavorite}
  onPhotoClick={openViewer}
/>
```

### PhotoUploader Example
```tsx
<PhotoUploader
  onUpload={async (files) => {
    await uploadPhotos(files)
    setFiles([])
  }}
/>
```

---

## Component Library Dependencies

- **Radix UI**: Unstyled, accessible primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon set
- **React Hook Form**: Form state management
- **Zod**: Schema validation

