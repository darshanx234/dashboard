import { getWithAuth, postWithAuth, putWithAuth, deleteWithAuth } from '../api-client';

// Client Types
export interface Client {
    _id: string;
    photographerId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    notes?: string;
    albumIds: string[];
    eventIds: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateClientDto {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    notes?: string;
}

export interface UpdateClientDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
}

export interface GetClientsParams {
    search?: string;
    limit?: number;
    page?: number;
}

export interface GetClientsResponse {
    clients: Client[];
    total: number;
    page: number;
    totalPages: number;
}

class ClientApi {
    /**
     * Get all clients for the photographer
     */
    async getClients(params?: GetClientsParams): Promise<GetClientsResponse> {
        const queryParams = new URLSearchParams();

        if (params?.search) queryParams.append('search', params.search);
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.page) queryParams.append('page', params.page.toString());

        const response = await getWithAuth<GetClientsResponse>(
            `/api/clients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
        );

        return response;
    }

    /**
     * Get a single client by ID
     */
    async getClient(clientId: string): Promise<Client> {
        const response = await getWithAuth<Client>(`/api/clients/${clientId}`);
        return response;
    }

    /**
     * Create a new client
     */
    async createClient(data: CreateClientDto): Promise<Client> {
        const response = await postWithAuth<Client>('/api/clients', data);
        return response;
    }

    /**
     * Update an existing client
     */
    async updateClient(clientId: string, data: UpdateClientDto): Promise<Client> {
        const response = await putWithAuth<Client>(`/api/clients/${clientId}`, data);
        return response;
    }

    /**
     * Delete a client
     */
    async deleteClient(clientId: string): Promise<void> {
        await deleteWithAuth(`/api/clients/${clientId}`);
    }

    /**
     * Link an album to a client
     */
    async linkAlbum(clientId: string, albumId: string): Promise<Client> {
        const response = await postWithAuth<Client>(
            `/api/clients/${clientId}/albums/${albumId}`,
            {}
        );
        return response;
    }

    /**
     * Unlink an album from a client
     */
    async unlinkAlbum(clientId: string, albumId: string): Promise<Client> {
        const response = await deleteWithAuth<Client>(
            `/api/clients/${clientId}/albums/${albumId}`
        );
        return response;
    }

    /**
     * Get all events for a client
     */
    async getClientEvents(clientId: string): Promise<any[]> {
        const response = await getWithAuth<{ events: any[] }>(
            `/api/clients/${clientId}/events`
        );
        return response.events;
    }

    /**
     * Get all albums for a client
     */
    async getClientAlbums(clientId: string): Promise<any[]> {
        const response = await getWithAuth<{ albums: any[] }>(
            `/api/clients/${clientId}/albums`
        );
        return response.albums;
    }

    /**
     * Link an event to a client
     */
    async linkEvent(clientId: string, eventId: string): Promise<Client> {
        const response = await postWithAuth<Client>(
            `/api/clients/${clientId}/events/${eventId}`,
            {}
        );
        return response;
    }

    /**
     * Unlink an event from a client
     */
    async unlinkEvent(clientId: string, eventId: string): Promise<Client> {
        const response = await deleteWithAuth<Client>(
            `/api/clients/${clientId}/events/${eventId}`
        );
        return response;
    }
}

export const clientApi = new ClientApi();
