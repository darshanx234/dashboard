import { getWithAuth, postWithAuth, putWithAuth, deleteWithAuth } from '@/lib/utils/api-client';

// Admin User Types
export interface AdminUser {
    _id: string;
    phone: string;
    email?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    avatar?: string;
    bio?: string;
    userType: 'photographer' | 'studio_owner';
    role: 'photographer' | 'client' | 'admin';
    status: 'active' | 'suspended' | 'banned';
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface GetUsersParams {
    search?: string;
    role?: 'photographer' | 'client' | 'admin' | '';
    status?: 'active' | 'suspended' | 'banned' | '';
    limit?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface GetUsersResponse {
    users: AdminUser[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasMore: boolean;
    };
}

export interface CreateUserDto {
    phone: string;
    email?: string;
    password?: string;
    fullName?: string;
    businessName?: string;
    userType: 'photographer' | 'studio_owner';
    role?: 'photographer' | 'client' | 'admin';
    status?: 'active' | 'suspended' | 'banned';
}

export interface UpdateUserDto {
    fullName?: string;
    businessName?: string;
    email?: string;
    phone?: string;
    userType?: 'photographer' | 'studio_owner';
    role?: 'photographer' | 'client' | 'admin';
    bio?: string;
    avatar?: string;
}

export interface UserStatsResponse {
    user: AdminUser;
    stats: {
        albums: {
            totalAlbums: number;
            totalPhotos: number;
            totalStorageUsed: number;
            totalViews: number;
            totalDownloads: number;
            publishedAlbums: number;
            draftAlbums: number;
            archivedAlbums: number;
        };
        photos: {
            totalPhotos: number;
            totalSize: number;
            totalViews: number;
            totalDownloads: number;
            totalFavorites: number;
            processedPhotos: number;
        };
        wallet: {
            balance: number;
            currency: string;
            isActive: boolean;
        };
    };
    recentAlbums: Array<{
        _id: string;
        title: string;
        status: string;
        totalPhotos: number;
        storageUsed: number;
        createdAt: string;
    }>;
    recentTransactions: Array<{
        _id: string;
        type: 'credit' | 'debit';
        amount: number;
        category: string;
        description: string;
        createdAt: string;
    }>;
}

class AdminUserApi {
    private baseUrl = '/api/admin/users';

    /**
     * Get all users with pagination and filters
     */
    async getUsers(params?: GetUsersParams): Promise<GetUsersResponse> {
        const queryParams = new URLSearchParams();

        if (params?.search) queryParams.append('search', params.search);
        if (params?.role) queryParams.append('role', params.role);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const query = queryParams.toString();
        return getWithAuth<GetUsersResponse>(`${this.baseUrl}${query ? `?${query}` : ''}`);
    }

    /**
     * Get a single user by ID
     */
    async getUser(userId: string): Promise<{ user: AdminUser }> {
        return getWithAuth<{ user: AdminUser }>(`${this.baseUrl}/${userId}`);
    }

    /**
     * Create a new user
     */
    async createUser(data: CreateUserDto): Promise<{ message: string; user: AdminUser }> {
        return postWithAuth<{ message: string; user: AdminUser }>(this.baseUrl, data);
    }

    /**
     * Update an existing user
     */
    async updateUser(userId: string, data: UpdateUserDto): Promise<{ message: string; user: AdminUser }> {
        return putWithAuth<{ message: string; user: AdminUser }>(`${this.baseUrl}/${userId}`, data);
    }

    /**
     * Delete a user
     */
    async deleteUser(userId: string): Promise<{ message: string }> {
        return deleteWithAuth<{ message: string }>(`${this.baseUrl}/${userId}`);
    }

    /**
     * Update user status (activate/suspend/ban)
     */
    async updateUserStatus(
        userId: string,
        status: 'active' | 'suspended' | 'banned'
    ): Promise<{ message: string; user: AdminUser }> {
        const response = await fetch(`${this.baseUrl}/${userId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update status');
        }

        return data;
    }

    /**
     * Get user stats and detailed information
     */
    async getUserStats(userId: string): Promise<UserStatsResponse> {
        return getWithAuth<UserStatsResponse>(`${this.baseUrl}/${userId}/stats`);
    }
}

export const adminUserApi = new AdminUserApi();
