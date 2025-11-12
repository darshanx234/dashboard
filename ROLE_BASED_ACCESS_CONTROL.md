# Role-Based Access Control (RBAC) System

## Overview
PhotoAlumnus now includes a comprehensive role-based access control system with three distinct user roles: **Photographer**, **Client**, and **Admin**.

## User Roles

### 1. Photographer (Default Role)
**Primary user who uploads and shares albums**

#### Sidebar Menu:
- 📊 **Dashboard** - Stats, recent activity, quick actions
- 📷 **Albums** - Create, manage, upload photos
- 📈 **Analytics** - Views, downloads, favorites tracking
- 👥 **Clients** - List of client names linked to albums
- 📄 **Documents** - Invoices, agreements
- ⚙️ **Settings** - Profile, password, billing, API key

#### Quick Actions (Dashboard):
- Create New Album
- Invite Client (generate token link)
- Generate Share Link / QR
- View Analytics
- Manage Account Settings

#### Accessible Routes:
- `/` - Dashboard
- `/albums` - Album management
- `/analytics` - Analytics dashboard
- `/clients` - Client management
- `/documents` - Document management
- `/settings` - Account settings
- `/profile` - User profile

---

### 2. Client (Viewer Role)
**Access through shared token/link with limited privileges**

#### Sidebar Menu:
- 📷 **My Albums** - Albums shared with this client
- ❤️ **Favorites** - Selected or proofed photos
- 📥 **Downloads** - Previously downloaded sets
- ⚙️ **Settings** - Change password, manage email

#### Accessible Routes:
- `/my-albums` - View shared albums
- `/favorites` - Favorite photos
- `/downloads` - Download history
- `/settings` - Account settings
- `/profile` - User profile

---

### 3. Admin (System Owner)
**Manages users, usage, billing, and system reports**

#### Sidebar Menu:
- 📊 **Dashboard** - Platform metrics (revenue, users, uploads)
- 👤 **Users** - Manage photographers, ban/suspend
- 📷 **Albums** - Overview of all albums
- 📈 **Reports** - Billing and usage stats
- ⚙️ **Settings** - System configuration

#### Accessible Routes:
- `/admin/dashboard` - Admin dashboard
- `/admin/users` - User management
- `/admin/albums` - Platform-wide album overview
- `/admin/reports` - System reports
- `/admin/settings` - System configuration
- `/settings` - Account settings
- `/profile` - User profile

---

## Technical Implementation

### Database Schema
Updated `User` model with role field:

```typescript
interface IUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'photographer' | 'client' | 'admin';
  // ... other fields
}
```

**Default role:** `photographer`

### JWT Token
Tokens now include the user's role:

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: 'photographer' | 'client' | 'admin';
}
```

### Middleware Protection
Route protection is enforced in `middleware.ts`:

```typescript
// Automatically redirects users trying to access unauthorized routes
// Example: Client trying to access /albums → redirected to /my-albums
```

### Sidebar Configuration
Dynamic sidebar menu based on user role (`lib/sidebar-config.ts`):

```typescript
import { getSidebarMenu } from '@/lib/sidebar-config';

const user = useAuthStore((state) => state.user);
const menuItems = getSidebarMenu(user?.role);
```

### Role Access Functions

#### `hasRoleAccess(route, role)`
Check if a role has access to a specific route:

```typescript
import { hasRoleAccess } from '@/lib/role-access';

const canAccess = hasRoleAccess('/albums', 'photographer'); // true
const canAccess = hasRoleAccess('/albums', 'client'); // false
```

#### `getDefaultHomePage(role)`
Get the default landing page for a role:

```typescript
import { getDefaultHomePage } from '@/lib/role-access';

const homePage = getDefaultHomePage('photographer'); // '/'
const homePage = getDefaultHomePage('client'); // '/my-albums'
const homePage = getDefaultHomePage('admin'); // '/admin/dashboard'
```

---

## Route Structure

### Photographer Routes
```
/ (Dashboard)
/albums
/analytics
/clients
/documents
/settings
/profile
```

### Client Routes
```
/my-albums (Default home)
/favorites
/downloads
/settings
/profile
```

### Admin Routes
```
/admin/dashboard (Default home)
/admin/users
/admin/albums
/admin/reports
/admin/settings
/settings
/profile
```

---

## Security Features

### 1. Middleware Protection
- All routes require authentication (except `/login` and `/signup`)
- Invalid tokens are automatically cleared
- Users redirected to login if unauthenticated

### 2. Role-Based Redirects
- Users accessing unauthorized routes are redirected to their role's home page
- Example: Client accessing `/albums` → redirected to `/my-albums`

### 3. Automatic Role Detection
- User role stored in JWT token
- Role validated on every request
- Sidebar menu updates automatically based on role

### 4. Token Validation
- Tokens include role information
- Invalid or expired tokens trigger re-authentication
- Role changes require new token generation

---

## User Experience

### Login Flow
1. User enters credentials
2. Server validates and generates JWT with role
3. User redirected to role-specific home page:
   - Photographer → `/`
   - Client → `/my-albums`
   - Admin → `/admin/dashboard`

### Navigation
- Sidebar shows only accessible routes for user's role
- Active route highlighted
- Mobile-responsive with overlay toggle

### Access Denial
- Unauthorized route access automatically redirects
- No error messages - seamless UX
- User lands on their role-appropriate home page

---

## Configuration Files

### `lib/models/User.ts`
User schema with role field

### `lib/sidebar-config.ts`
Sidebar menu configurations for each role

### `lib/role-access.ts`
Role-based access control utilities

### `middleware.ts`
Route protection and access enforcement

### `lib/jwt.ts`
JWT generation with role payload

### `components/layout/app-sidebar.tsx`
Dynamic sidebar component

---

## Usage Examples

### Check User Role in Component
```typescript
'use client';

import { useAuthStore } from '@/lib/store/auth';

export function MyComponent() {
  const user = useAuthStore((state) => state.user);

  if (user?.role === 'photographer') {
    return <PhotographerView />;
  }

  if (user?.role === 'client') {
    return <ClientView />;
  }

  if (user?.role === 'admin') {
    return <AdminView />;
  }

  return null;
}
```

### Conditionally Render Based on Role
```typescript
{user?.role === 'photographer' && (
  <Button>Create Album</Button>
)}

{user?.role === 'admin' && (
  <AdminControls />
)}
```

### Get Role-Specific Data
```typescript
const isPhotographer = user?.role === 'photographer';
const isClient = user?.role === 'client';
const isAdmin = user?.role === 'admin';
```

---

## Testing Scenarios

### Test Different Roles
1. **Create photographer account** (default)
   - Signup → should see photographer dashboard
   - Access `/albums` → should work
   - Access `/my-albums` → should redirect to `/`

2. **Manually change role to 'client'** (via database)
   - Login → should redirect to `/my-albums`
   - Access `/albums` → should redirect to `/my-albums`
   - Sidebar shows client menu only

3. **Manually change role to 'admin'** (via database)
   - Login → should redirect to `/admin/dashboard`
   - Access `/albums` → should redirect to `/admin/dashboard`
   - Sidebar shows admin menu only

---

## Future Enhancements

### Planned Features
- [ ] Role change API endpoint (admin only)
- [ ] Permission granularity (read/write/delete)
- [ ] Custom role creation
- [ ] Activity logging per role
- [ ] Role-based rate limiting

### Possible Additions
- [ ] Team roles (photographer + assistants)
- [ ] Guest access (temporary, limited viewing)
- [ ] Partner roles (vendors, printers)
- [ ] Super admin role (platform owner)

---

## Migration Notes

### Existing Users
- All existing users default to `photographer` role
- Database migration not required (schema handles defaults)
- No breaking changes to existing functionality

### Updating User Roles
Use MongoDB shell or admin interface:

```javascript
// Update specific user to client
db.users.updateOne(
  { email: "client@example.com" },
  { $set: { role: "client" } }
);

// Update specific user to admin
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
);
```

---

## Troubleshooting

### Issue: User stuck in redirect loop
**Solution:** Clear cookies and localStorage, then login again

### Issue: Sidebar not showing correct menu
**Solution:** Token might be cached without role. Logout and login again.

### Issue: Access to unauthorized route
**Solution:** Middleware will automatically redirect to role home page

### Issue: Role not updating after database change
**Solution:** User needs to logout and login to get new JWT with updated role

---

## Summary

✅ **Three distinct user roles** with appropriate permissions  
✅ **Automatic route protection** via middleware  
✅ **Dynamic sidebar menus** based on role  
✅ **Seamless redirects** for unauthorized access  
✅ **JWT-based role validation**  
✅ **Mobile-responsive navigation**  
✅ **Role-specific dashboards**  
✅ **Secure and scalable architecture**

The RBAC system is **production-ready** and provides a solid foundation for multi-role application management! 🚀