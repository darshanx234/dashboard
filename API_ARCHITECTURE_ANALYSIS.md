# API Architecture Analysis & Design Flaws

## 📊 Overview of APIs in the System

### Total APIs: **4 Main Service Groups**

1. **Album API** - 5 endpoints
2. **Photo API** - 3 endpoints  
3. **Upload API** - 3 endpoints
4. **Share API** - 6 endpoints

**Total: 17 Service Methods**

---

## 🔄 Complete API Flow Architecture

### **Layer 1: API Client Layer** (`lib/api-client.ts`)
```
┌─────────────────────────────────────────────┐
│         API Client Layer                    │
│  (Authentication & HTTP Management)         │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┐
        │                     │              │
   [apiWithAuth]      [getWithAuth]   [postWithAuth]
        │              [putWithAuth]    [deleteWithAuth]
        │              [PATCH - Manual]
        │
        ▼
   ┌─────────────────────────┐
   │  Token Management       │
   │  • Read from Zustand    │
   │  • Add to Headers       │
   │  • Error Handling       │
   └─────────────────────────┘
```

**Key Functions:**
```
apiWithAuth<T>(url, options?)
  ├─ Read token from useAuthStore.getState()
  ├─ Add Authorization: Bearer {token}
  ├─ Handle 401 errors → Clear state & redirect
  └─ Throw errors

getWithAuth<T>(url)
postWithAuth<T>(url, body)
putWithAuth<T>(url, body)
deleteWithAuth<T>(url, body?)
```

---

### **Layer 2: Service API Layer** (`lib/api/albums.ts`)

#### **A. Album API (5 endpoints)**
```typescript
albumApi = {
  getAlbums(params?)      // GET /api/albums
  getAlbum(id)           // GET /api/albums/:id
  createAlbum(data)      // POST /api/albums
  updateAlbum(id, data)  // PUT /api/albums/:id
  deleteAlbum(id)        // DELETE /api/albums/:id
}
```

#### **B. Photo API (3 endpoints)**
```typescript
photoApi = {
  getPhotos(albumId, params?)           // GET /api/albums/:id/photos
  createPhoto(albumId, data)            // POST /api/albums/:id/photos
  deletePhotos(albumId, photoIds[])     // DELETE /api/albums/:id/photos
}
```

#### **C. Upload API (3 endpoints)**
```typescript
uploadApi = {
  getPresignedUrl(data)        // POST /api/upload/presigned
  uploadToS3(url, file)        // Direct S3 upload (no auth needed)
  uploadPhoto(albumId, file)   // Orchestrator method
}
```

#### **D. Share API (6 endpoints)**
```typescript
shareApi = {
  createShare(albumId, data)              // POST /api/albums/:id/share
  getShares(albumId)                      // GET /api/albums/:id/share
  updateShare(albumId, data)              // PATCH /api/albums/:id/share
  revokeShare(albumId, shareId)           // DELETE /api/albums/:id/share?shareId
  revokeAllShares(albumId)                // DELETE /api/albums/:id/share?all=true
  accessSharedAlbum(token)                // GET /api/shared/:token (NO AUTH)
  verifySharePassword(token, password)    // POST /api/shared/:token/verify
}
```

---

### **Layer 3: State Management** (`lib/store/auth.ts`)

```
Zustand Store (useAuthStore)
│
├─ State Variables:
│  ├─ user: User | null
│  ├─ token: string | null
│  └─ loading: boolean
│
├─ Actions (Direct Auth API Calls):
│  ├─ loginWithVerification()     // POST /api/auth/login
│  ├─ signup()                    // POST /api/auth/signup
│  ├─ logout()                    // POST /api/auth/logout
│  └─ checkAuth()                 // GET /api/auth/me
│
└─ Persistence:
   └─ localStorage: 'auth-storage'
```

---

### **Layer 4: Middleware** (`lib/auth-middleware.ts`)

```
Backend Middleware (Server-side)
│
├─ verifyAuth(request)
│  ├─ Extract token from Authorization header
│  ├─ Fallback to cookies
│  └─ Verify JWT
│
└─ withAuth(handler)
   └─ Wrapper for protected routes
```

---

## 📡 Complete Request/Response Flow

### **Authenticated Request Flow:**
```
1. Component makes API call
   └─ albumApi.getAlbum(id)

2. Service Method (albumApi)
   └─ Calls getWithAuth('/api/albums/:id')

3. API Client Layer (apiWithAuth)
   └─ Read token from Zustand store
   └─ Add Authorization header
   └─ Send fetch request

4. Network
   └─ Browser sends: GET /api/albums/:id
              Headers: Authorization: Bearer {token}

5. Backend Middleware (verifyAuth)
   └─ Extract token from header or cookies
   └─ Verify JWT signature
   └─ Extract userId from decoded token

6. API Route Handler
   └─ Uses userId for data access control
   └─ Queries database
   └─ Returns data

7. Response & Error Handling
   ├─ 200 OK: Return data
   ├─ 401 Unauthorized:
   │  └─ Clear Zustand state
   │  └─ Clear localStorage
   │  └─ Redirect to /login
   └─ 500 Error: Throw error
```

---

## 🔐 Authentication Flow

```
┌──────────────────────────────────────────────┐
│           Login/Signup Flow                  │
└──────────┬───────────────────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │  User Credentials            │
    │  email + password            │
    └──────┬───────────────────────┘
           │
    ┌──────▼──────────────────────────────────┐
    │  POST /api/auth/login (Direct fetch)    │
    │  (NOT using api-client layer)           │
    └──────┬───────────────────────────────────┘
           │
    ┌──────▼──────────────────────────────────┐
    │  Backend: Hash & Compare Password       │
    │  Return: { user, token }                │
    └──────┬───────────────────────────────────┘
           │
    ┌──────▼──────────────────────────────────┐
    │  Store in Zustand + localStorage        │
    │  useAuthStore.setToken(token)           │
    │  useAuthStore.setUser(user)             │
    └──────┬───────────────────────────────────┘
           │
    ┌──────▼──────────────────────────────────┐
    │  Token Ready for use in apiWithAuth      │
    │  All future requests include Bearer token│
    └──────────────────────────────────────────┘
```

---

## ⚠️ ARCHITECTURAL FLAWS & ISSUES

### **FLAW #1: Inconsistent API Client Usage**
**Severity: HIGH** 🔴

**Issue:**
Some API calls use the `api-client` layer (with token management), while others bypass it completely:

```typescript
// ❌ INCONSISTENT: Auth store calls direct fetch
loginWithVerification: async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {  // Direct fetch!
    method: 'POST',
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });
}

// ✅ CONSISTENT: Service layer uses api-client
albumApi = {
  getAlbums: async () => {
    return getWithAuth<...>('/api/albums');  // Uses api-client
  }
}

// ❌ INCONSISTENT: Share API mixes both approaches
updateShare: async (albumId: string, data) => {
  const token = document.cookie  // Manual token extraction!
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];
  
  const response = await fetch(`/api/albums/${albumId}/share`, {
    method: 'PATCH',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
}
```

**Problems:**
- ❌ Token management scattered across multiple files
- ❌ No consistent error handling
- ❌ Manual token extraction from cookies (fragile)
- ❌ Unauthorized error handling not standardized
- ❌ Hard to maintain and debug

---

### **FLAW #2: No Dedicated Auth API Service**
**Severity: HIGH** 🔴

**Issue:**
Authentication endpoints are called directly in Zustand store instead of a dedicated `authApi` service:

```typescript
// Current: Auth logic mixed with state management
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      loginWithVerification: async (email, password) => {
        // Auth logic here directly
        const response = await fetch('/api/auth/login', { ... });
      },
      signup: async (email, password) => {
        const response = await fetch('/api/auth/signup', { ... });
      },
    })
  )
);

// Should be: Separate authApi service
authApi = {
  loginWithVerification(email, password) { /* ... */ },
  signup(email, password) { /* ... */ },
  logout() { /* ... */ },
  checkAuth() { /* ... */ },
}
```

**Problems:**
- ❌ Mixing business logic with state management
- ❌ Hard to reuse auth logic
- ❌ Can't call auth methods from other services
- ❌ Authentication errors handled inconsistently
- ❌ No single source of truth for API paths

---

### **FLAW #3: Token Access Pattern Issues**
**Severity: MEDIUM** 🟡

**Issue:**
Token is accessed at request time from Zustand, which can cause race conditions:

```typescript
export async function apiWithAuth<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const { token } = useAuthStore.getState();  // ⚠️ Synchronous read
  
  // Token might have just expired or changed
  // No way to refresh or retry with new token
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,  // Token might be stale
    },
  });
}
```

**Problems:**
- ❌ No token refresh mechanism (JWT expiry not handled)
- ❌ No retry logic for expired tokens
- ❌ State could change between read and request
- ❌ Cookies used as fallback but not reliable

---

### **FLAW #4: Dual Token Storage (Header + Cookie)**
**Severity: MEDIUM** 🟡

**Issue:**
Token stored in both places, creating sync issues:

```typescript
// Stored in Zustand + localStorage
useAuthStore.setToken(token);
localStorage.setItem('auth-storage', JSON.stringify({ token }));

// Also set in cookies by backend
response.headers.setHeader('Set-Cookie', `token=${token}`);

// Sent via both header AND cookies
credentials: 'include',  // Sends cookies
headers: { Authorization: `Bearer ${token}` }  // Also sends header
```

**Problems:**
- ❌ Token stored in 3 places (Zustand, localStorage, cookies)
- ❌ Sync problems if one expires before others
- ❌ localStorage not secure for sensitive tokens (XSS vulnerable)
- ❌ Unclear which is source of truth

---

### **FLAW #5: Inconsistent Error Handling**
**Severity: HIGH** 🔴

**Issue:**
Different error handling patterns across services:

```typescript
// Pattern 1: apiWithAuth (checks multiple conditions)
if (response.status === 401 || 
    data.error?.toLowerCase().includes('unauthorized') ||
    data.error?.toLowerCase().includes('token') ||
    data.error?.toLowerCase().includes('expired token') ||
    ...) { handleUnauthorizedError(); }

// Pattern 2: Share API (no error handling)
accessSharedAlbum: async (token: string) => {
  const response = await fetch(`/api/shared/${token}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to access shared album');
  }
}

// Pattern 3: Auth Store (checks status only)
if (response.status === 401) {
  set({ user: null, token: null });
}

// Pattern 4: Zustand checkAuth (redirects and clears)
if (response.status === 401) {
  window.location.href = '/login';
  localStorage.removeItem('auth-storage');
}
```

**Problems:**
- ❌ No standardized error response format
- ❌ Different retry logic across services
- ❌ Inconsistent 401 handling (some redirect, some throw)
- ❌ Hard to add global error handling

---

### **FLAW #6: No PATCH Method in API Client**
**Severity: MEDIUM** 🟡

**Issue:**
No built-in `patchWithAuth` function, forcing workarounds:

```typescript
// Share API must call fetch directly for PATCH
updateShare: async (albumId: string, data) => {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];

  const response = await fetch(`/api/albums/${albumId}/share`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
}
```

**Problems:**
- ❌ Manual token extraction (fragile string parsing)
- ❌ Bypasses api-client layer error handling
- ❌ Inconsistent with other service methods
- ❌ Hard to maintain

---

### **FLAW #7: No Global Error Boundary**
**Severity: MEDIUM** 🟡

**Issue:**
Each component handles errors independently, no centralized error handling:

```typescript
// Every component does this
try {
  const data = await albumApi.getAlbums();
} catch (error: any) {
  toast({
    title: 'Error',
    description: error.message || 'Failed to load albums',
  });
}

// No centralized place to handle:
// - Network errors
// - Timeout errors
// - Retry logic
// - Global error notifications
```

**Problems:**
- ❌ Repetitive error handling code
- ❌ Inconsistent error messages to users
- ❌ No global retry mechanism
- ❌ Hard to add new error handling

---

### **FLAW #8: No Request/Response Interceptors**
**Severity: MEDIUM** 🟡

**Issue:**
Can't intercept requests/responses globally:

```typescript
// Current: No way to add logging, metrics, request transformation
const response = await fetch(url, options);

// Should support:
// - Request transformation
// - Response transformation
// - Logging
// - Analytics
// - Request timing
// - Request cancellation
```

**Problems:**
- ❌ No request logging for debugging
- ❌ No response transformation
- ❌ Can't track API metrics
- ❌ No request timeout handling

---

### **FLAW #9: Type Safety Issues**
**Severity: LOW** 🟢

**Issue:**
API responses not fully typed:

```typescript
// Type casting instead of proper typing
const response = await shareApi.createShare(albumId, data);
return response as { shares: AlbumShare[]; shareType: string };

// Should be:
export interface CreateShareResponse {
  shares: AlbumShare[];
  shareType: string;
}
const response = await shareApi.createShare(...): Promise<CreateShareResponse>;
```

---

### **FLAW #10: No Request Cancellation**
**Severity: LOW** 🟢

**Issue:**
No ability to cancel in-flight requests:

```typescript
// If component unmounts, request still completes
const data = await albumApi.getAlbums();  // Can't cancel

// Should support:
const controller = new AbortController();
const data = await albumApi.getAlbums({ signal: controller.signal });

// Can cancel:
controller.abort();
```

---

## ✅ RECOMMENDED FIXES

### **FIX #1: Create Unified API Client Architecture** 🔧

**Before:**
```typescript
// api-client.ts - Missing PATCH support
getWithAuth(), postWithAuth(), putWithAuth(), deleteWithAuth()
```

**After:**
```typescript
// api-client.ts - Complete implementation
interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  interceptors?: {
    request?: (config: any) => any;
    response?: (response: any) => any;
    error?: (error: any) => any;
  };
}

class ApiClient {
  private baseURL = '/api';
  private timeout = 30000;
  
  async request<T>(
    method: string,
    url: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    const { token } = useAuthStore.getState();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        signal: controller.signal,
        ...options,
      });
      
      // Handle all errors consistently
      if (!response.ok) {
        await this.handleError(response);
      }
      
      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  // Typed methods
  get<T>(url: string) { return this.request<T>('GET', url); }
  post<T>(url: string, data: any) { return this.request<T>('POST', url, data); }
  put<T>(url: string, data: any) { return this.request<T>('PUT', url, data); }
  patch<T>(url: string, data: any) { return this.request<T>('PATCH', url, data); }
  delete<T>(url: string, data?: any) { return this.request<T>('DELETE', url, data); }
  
  private async handleError(response: Response) {
    const data = await response.json();
    
    if (response.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    
    throw new ApiError(data.error || 'API request failed', response.status);
  }
}

export const apiClient = new ApiClient();
```

---

### **FIX #2: Create Dedicated Auth API Service** 🔧

**Before:**
```typescript
// Auth logic mixed in Zustand store
useAuthStore.loginWithVerification = async (email, password) => {
  const response = await fetch('/api/auth/login', { ... });
}
```

**After:**
```typescript
// lib/api/auth.ts - Dedicated auth service
export const authApi = {
  async loginWithVerification(email: string, password: string) {
    return apiClient.post<LoginResponse>('/api/auth/login', {
      email,
      password,
    });
  },

  async signup(email: string, password: string) {
    return apiClient.post<SignupResponse>('/api/auth/signup', {
      email,
      password,
    });
  },

  async logout() {
    return apiClient.post('/api/auth/logout', {});
  },

  async checkAuth() {
    return apiClient.get<{ user: User }>('/api/auth/me');
  },

  async resetPassword(email: string) {
    return apiClient.post('/api/auth/forgot-password', { email });
  },

  async verifyOTP(email: string, otp: string) {
    return apiClient.post('/api/otp/verify', { email, otp });
  },
};

// Zustand store now only manages state, not API logic
useAuthStore = {
  loginWithVerification: async (email, password) => {
    const response = await authApi.loginWithVerification(email, password);
    set({ user: response.user, token: response.token });
  }
}
```

---

### **FIX #3: Implement Token Refresh Mechanism** 🔧

**Current:**
```typescript
// Token expires but no refresh
if (token) {
  headers.set('Authorization', `Bearer ${token}`);
}
```

**Solution:**
```typescript
class TokenManager {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number = 0;

  setToken(token: string, expiresIn: number) {
    this.token = token;
    this.tokenExpiresAt = Date.now() + expiresIn * 1000;
  }

  async getValidToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    // Token expired, try to refresh
    if (this.refreshToken) {
      const newToken = await this.refreshAccessToken();
      return newToken;
    }

    throw new Error('Token expired and no refresh token available');
  }

  private async refreshAccessToken(): Promise<string> {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });

    if (response.ok) {
      const { token, expiresIn } = await response.json();
      this.setToken(token, expiresIn);
      return token;
    }

    // Refresh failed, logout user
    useAuthStore.getState().logout();
    throw new Error('Failed to refresh token');
  }
}

export const tokenManager = new TokenManager();
```

---

### **FIX #4: Use Secure Token Storage** 🔧

**Before:**
```typescript
// ❌ INSECURE: localStorage vulnerable to XSS
localStorage.setItem('auth-storage', JSON.stringify({ token }));

// ❌ INSECURE: Cookies exposed to CSRF
headers.set('Authorization', `Bearer ${token}`);
credentials: 'include';
```

**After:**
```typescript
// ✅ SECURE: Memory storage for token (lost on refresh)
// ✅ SECURE: HttpOnly cookies set by backend (not accessible to JS)
// ✅ SECURE: Refresh token in HttpOnly cookie (server only)

// Client only stores non-sensitive data in localStorage
localStorage.setItem('auth-data', JSON.stringify({
  user: { id, email, name },  // No token!
  loginTime: Date.now(),
}));

// Backend sets HttpOnly cookie:
// Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Strict;
// Set-Cookie: refreshToken=<token>; HttpOnly; Secure; SameSite=Strict;
```

---

### **FIX #5: Standardize Error Handling** 🔧

**Before:**
```typescript
// Different error handling everywhere
if (response.status === 401 || data.error?.toLowerCase().includes('token')) {
  handleUnauthorizedError();
}

// Or
throw new Error(data.error || 'API request failed');

// Or
return { success: false, error: data.error };
```

**After:**
```typescript
// lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
  }
}

export class AuthError extends ApiError {}
export class ValidationError extends ApiError {}
export class NotFoundError extends ApiError {}

// Centralized error handling
function handleApiError(response: Response, data: any): never {
  if (response.status === 401) {
    throw new AuthError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  if (response.status === 400) {
    throw new ValidationError(data.error, 400, 'VALIDATION_ERROR', data.details);
  }
  if (response.status === 404) {
    throw new NotFoundError(data.error, 404, 'NOT_FOUND');
  }
  throw new ApiError(data.error || 'API request failed', response.status);
}

// Usage in components
try {
  const data = await albumApi.getAlbums();
} catch (error) {
  if (error instanceof AuthError) {
    // Handle auth error
  } else if (error instanceof ValidationError) {
    // Handle validation error
  } else if (error instanceof ApiError) {
    // Handle other API errors
  }
}
```

---

### **FIX #6: Add Request/Response Interceptors** 🔧

**Solution:**
```typescript
// lib/api/interceptors.ts
interface Interceptor {
  onRequest?(config: RequestConfig): RequestConfig;
  onResponse?(response: any): any;
  onError?(error: Error): Error;
}

class InterceptorManager {
  private interceptors: Interceptor[] = [];

  use(interceptor: Interceptor) {
    this.interceptors.push(interceptor);
  }

  executeRequest(config: RequestConfig): RequestConfig {
    return this.interceptors.reduce(
      (config, interceptor) => interceptor.onRequest?.(config) || config,
      config
    );
  }

  executeResponse(response: any): any {
    return this.interceptors.reduce(
      (response, interceptor) => interceptor.onResponse?.(response) || response,
      response
    );
  }
}

// Usage
interceptors.use({
  onRequest(config) {
    console.log(`[${config.method}] ${config.url}`);
    return config;
  },
  onResponse(response) {
    console.log(`Response status: ${response.status}`);
    return response;
  },
});
```

---

### **FIX #7: Create Global Error Boundary** 🔧

**Solution:**
```typescript
// hooks/useApiError.ts
export function useApiError() {
  const { toast } = useToast();

  const handleError = (error: unknown) => {
    if (error instanceof AuthError) {
      toast({
        title: 'Session Expired',
        description: 'Please login again',
        variant: 'destructive',
      });
    } else if (error instanceof ValidationError) {
      toast({
        title: 'Validation Error',
        description: error.message,
        variant: 'destructive',
      });
    } else if (error instanceof ApiError) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return { handleError };
}

// Usage in components
const { handleError } = useApiError();

try {
  const data = await albumApi.getAlbums();
} catch (error) {
  handleError(error);
}
```

---

### **FIX #8: Add Request Timeout & Cancellation** 🔧

**Solution:**
```typescript
interface RequestOptions {
  timeout?: number;
  signal?: AbortSignal;
  retry?: number;
}

async request<T>(
  method: string,
  url: string,
  data?: any,
  options?: RequestOptions
): Promise<T> {
  const timeout = options?.timeout || 30000;
  const controller = options?.signal ? new AbortController() : undefined;
  
  const timeoutId = setTimeout(() => {
    controller?.abort();
  }, timeout);

  try {
    const response = await fetch(`${this.baseURL}${url}`, {
      method,
      signal: controller?.signal,
      ...this.getHeaders(),
    });

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

// Usage
const controller = new AbortController();
try {
  const data = await albumApi.getAlbums({ signal: controller.signal });
} catch (error) {
  // Component unmounted, request cancelled
}

// Clean up
return () => {
  controller.abort();
};
```

---

## 📋 Implementation Priority

| Priority | Issue | Fix | Effort |
|----------|-------|-----|--------|
| 🔴 **HIGH** | Inconsistent API usage | Fix #1 + #2 | 4 hours |
| 🔴 **HIGH** | No auth service | Fix #2 | 2 hours |
| 🔴 **HIGH** | Inconsistent error handling | Fix #5 | 3 hours |
| 🟡 **MEDIUM** | No token refresh | Fix #3 | 2 hours |
| 🟡 **MEDIUM** | No PATCH support | Fix #1 | 30 min |
| 🟡 **MEDIUM** | Token storage security | Fix #4 | 2 hours |
| 🟢 **LOW** | No interceptors | Fix #6 | 1 hour |
| 🟢 **LOW** | No error boundary | Fix #7 | 1 hour |
| 🟢 **LOW** | No cancellation | Fix #8 | 1 hour |

**Total Refactoring Time: ~16 hours**

---

## 🎯 Summary

### Current Issues:
- ❌ **17 API methods** scattered across 4 services + Zustand
- ❌ **Inconsistent error handling** (5 different patterns)
- ❌ **No token refresh** mechanism
- ❌ **No auth service** (mixed with state management)
- ❌ **No global error boundary**
- ❌ **Token security issues** (localStorage storage)
- ❌ **No request/response interceptors**
- ❌ **No request cancellation**

### After Fixes:
- ✅ **Centralized API client** with consistent error handling
- ✅ **Dedicated auth service** separate from state
- ✅ **Token refresh** mechanism
- ✅ **Secure token storage** (HttpOnly cookies)
- ✅ **Global error boundary** for consistent UX
- ✅ **Request/response interceptors** for logging/metrics
- ✅ **Request cancellation** support
- ✅ **Type-safe API calls** throughout application

