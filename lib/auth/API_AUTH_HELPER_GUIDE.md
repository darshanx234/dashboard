# API Auth Helper Usage Guide

This document explains how to use the new auth helper functions for protecting API routes.

## Available Functions

### 1. `getAuthUser(request: NextRequest): AuthResult`
Extracts and verifies JWT token from request headers or cookies.

### 2. `withAuthProtection(handler)`
Higher-order function that wraps your route handler with authentication.

### 3. `withRoleProtection(allowedRoles, handler)`
Higher-order function that wraps your route handler with role-based access control.

### 4. Utility Functions
- `canManageAlbums(user)` - Check if user can manage albums
- `isAdmin(user)` - Check if user is admin
- `canAccessResource(user, resourceUserId)` - Check ownership or admin access
- `createUnauthorizedResponse(message?)` - Create 401 response
- `createForbiddenResponse(message?)` - Create 403 response

## Usage Examples

### Basic Authentication Protection

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuthProtection } from '@/lib/auth/api-auth-helper';

// GET /api/protected-route
export const GET = withAuthProtection(async (request: NextRequest, user) => {
  // user is automatically verified and available
  // user contains: { userId, email, role }
  
  return NextResponse.json({
    message: `Hello ${user.email}`,
    userId: user.userId
  });
});
```

### Role-Based Protection

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withRoleProtection } from '@/lib/auth/api-auth-helper';

// Only photographers and admins can access
export const POST = withRoleProtection(['photographer', 'admin'], async (request, user) => {
  const body = await request.json();
  
  // Create resource logic here
  
  return NextResponse.json({ success: true });
});

// Only admins can access
export const DELETE = withRoleProtection(['admin'], async (request, user) => {
  // Admin-only logic here
  return NextResponse.json({ message: 'Resource deleted' });
});
```

### Manual Auth Check (for complex logic)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createUnauthorizedResponse, canAccessResource } from '@/lib/auth/api-auth-helper';

export async function GET(request: NextRequest) {
  const auth = getAuthUser(request);
  
  if (!auth.success || !auth.user) {
    return createUnauthorizedResponse(auth.error);
  }
  
  const { searchParams } = new URL(request.url);
  const resourceOwnerId = searchParams.get('userId');
  
  // Check if user can access this specific resource
  if (!canAccessResource(auth.user, resourceOwnerId)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }
  
  // Continue with logic...
}
```

### Utility Function Usage

```typescript
import { canManageAlbums, isAdmin, createForbiddenResponse } from '@/lib/auth/api-auth-helper';

export const POST = withAuthProtection(async (request, user) => {
  // Check specific permissions
  if (!canManageAlbums(user)) {
    return createForbiddenResponse('Only photographers and admins can manage albums');
  }
  
  // Admin-specific logic
  if (isAdmin(user)) {
    // Admin can do additional things
  }
  
  // Regular logic...
});
```

## Migration from Old Auth Pattern

### Before (Old Pattern):
```typescript
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Route logic using decoded.userId
    
  } catch (error) {
    return NextResponse.json({ error: 'Auth failed' }, { status: 401 });
  }
}
```

### After (New Pattern):
```typescript
export const GET = withAuthProtection(async (request: NextRequest, user) => {
  // Route logic using user.userId
  // No need for manual auth checking
});
```

## Token Sources

The helper automatically checks for tokens in this order:
1. **Authorization header**: `Bearer <token>`
2. **Cookie**: `token=<token>`

## Error Responses

The helper provides consistent error responses:
- **401 Unauthorized**: Missing, invalid, or expired token
- **403 Forbidden**: Valid token but insufficient permissions
- **500 Internal Server Error**: Auth verification failed

## Type Safety

All functions are fully typed with TypeScript. The `user` parameter in handlers contains:

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role?: 'photographer' | 'client' | 'admin';
  iat?: number;  // issued at
  exp?: number;  // expires at
}
```