# Quick Start Guide - Photography Album System

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## Key Routes

### Photographer Routes
- `/photographer` - Album dashboard
- `/photographer/albums/new` - Create album
- `/photographer/albums/[id]` - Edit album

### Client Routes
- `/gallery/[token]` - View shared gallery

### Auth Routes
- `/login` - Sign in
- `/signup` - Create account
- `/profile` - User profile

---

## Core Components Quick Reference

### Display Albums
```tsx
import { AlbumCard } from '@/components/photography/album-card'

<AlbumCard
  album={album}
  onShare={handleShare}
  onDelete={handleDelete}
/>
```

### Upload Photos
```tsx
import { PhotoUploader } from '@/components/photography/photo-uploader'

<PhotoUploader
  onUpload={async (files) => {
    // Handle upload
  }}
/>
```

### Display Photos
```tsx
import { PhotoGrid } from '@/components/photography/photo-grid'

<PhotoGrid
  photos={photos}
  viewMode="grid"
  onPhotoClick={handlePhotoClick}
/>
```

### Share Configuration
```tsx
import { ShareModal } from '@/components/photography/share-modal'

<ShareModal
  isOpen={isOpen}
  onClose={closeModal}
  albumId={albumId}
  onCreateShare={handleCreateShare}
/>
```

### Full-Screen Viewer
```tsx
import { PhotoViewer } from '@/components/photography/photo-viewer'

<PhotoViewer
  photos={photos}
  initialPhotoId={photoId}
  isOpen={isOpen}
  onClose={closeViewer}
  canDownload={true}
  canFavorite={true}
/>
```

---

## Common Tasks

### Create Album
1. Click "New Album" on dashboard
2. Fill in metadata
3. Upload photos
4. Click "Create Album"

### Share Album
1. Find album on dashboard
2. Click menu (⋮)
3. Select "Share"
4. Configure settings
5. Click "Generate Share Link"

### Access Shared Album
1. Click share link
2. Enter password (if required)
3. Browse and interact with photos

---

## File Organization

```
components/photography/
├── album-card.tsx           # Album display
├── album-form.tsx           # Create/edit form
├── photo-grid.tsx           # Photo display
├── photo-uploader.tsx       # Upload handler
├── photo-viewer.tsx         # Full-screen viewer
├── gallery-view.tsx         # Client gallery
└── share-modal.tsx          # Share settings
```

---

## Styling Guide

### Using Tailwind
All components use Tailwind CSS. Key utilities:
- `space-y-4` - Vertical spacing
- `grid grid-cols-3` - Responsive grid
- `rounded-lg` - Border radius
- `shadow-md` - Elevation
- `transition-all` - Smooth animations

### Color Variables
- `bg-primary` - Blue primary
- `bg-secondary` - Gray secondary
- `text-muted-foreground` - Light gray text
- `border-destructive` - Red for errors

---

## Build & Deploy

### Production Build
```bash
npm run build
npm run start
```

### Deploy to Vercel
```bash
# Just push to main branch
# Vercel auto-deploys
```

---

## Database

### Supabase Setup
1. Create Supabase project
2. Run migrations
3. Set RLS policies
4. Get credentials for `.env.local`

### Tables
- `albums` - Photo collections
- `photos` - Individual photos
- `shares` - Share configurations
- `favorites` - Client favorites

---

## Authentication

### Sign Up
Users create account with email/password via `/signup`

### Login
Users sign in via `/login`

### Protected Routes
Use `useAuth()` hook to check authentication:
```tsx
const { user, loading } = useAuth()

if (!user) return <Redirect to="/login" />
```

---

## Responsive Breakpoints

```
Mobile:  < 640px  (1-column grid)
Tablet:  640-1024px (2-column grid)
Desktop: > 1024px  (3+ column grid)
```

---

## Accessibility Checklist

- ✓ Keyboard navigation (Tab, Enter, Escape)
- ✓ Screen reader support (semantic HTML)
- ✓ Color contrast (4.5:1 minimum)
- ✓ Focus indicators (visible)
- ✓ Touch targets (44px minimum)

---

## Performance Tips

- Use `React.memo()` for expensive components
- Implement image lazy loading
- Code split by route (automatic with Next.js)
- Cache API responses when possible

---

## Troubleshooting

### Build Fails
```bash
# Clear cache
rm -rf .next
npm run build
```

### Styles Not Applied
- Check Tailwind config
- Verify className is correct
- Clear browser cache

### Database Connection Issues
- Verify env variables
- Check Supabase status
- Review RLS policies

---

## Documentation Links

- **Design System:** `DESIGN_SPECS.md`
- **User Flows:** `USER_FLOWS.md`
- **Components:** `COMPONENT_SPECS.md`
- **Full Docs:** `README_PHOTOGRAPHY_SYSTEM.md`

---

## Support

For issues:
1. Check documentation
2. Review component examples
3. Check browser console
4. Review RLS policies in Supabase

---

Happy building! 🚀
