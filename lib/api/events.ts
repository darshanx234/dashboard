import { getWithAuth, postWithAuth, putWithAuth, deleteWithAuth } from '../api-client';

// Event Types
export type EventType = 'wedding' | 'portrait' | 'corporate' | 'event' | 'other';
export type EventStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Event {
    _id: string;
    photographerId: string;
    clientId: string;
    albumId?: string;
    title: string;
    description?: string;
    type: EventType;
    status: EventStatus;
    startDate: Date;
    endDate: Date;
    location?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateEventDto {
    clientId: string;
    albumId?: string;
    title: string;
    description?: string;
    type: EventType;
    status?: EventStatus;
    startDate: Date;
    endDate: Date;
    location?: string;
    notes?: string;
}

export interface UpdateEventDto {
    clientId?: string;
    albumId?: string;
    title?: string;
    description?: string;
    type?: EventType;
    status?: EventStatus;
    startDate?: Date;
    endDate?: Date;
    location?: string;
    notes?: string;
}

export interface GetEventsParams {
    clientId?: string;
    startDate?: Date;
    endDate?: Date;
    type?: EventType;
    status?: EventStatus;
}

export interface GetEventsResponse {
    events: Event[];
    total: number;
}

// Event type configurations
export const EVENT_TYPES = {
    wedding: { label: 'Wedding', icon: '🎉', color: '#9333ea' },
    portrait: { label: 'Portrait', icon: '👤', color: '#3b82f6' },
    corporate: { label: 'Corporate', icon: '🏢', color: '#10b981' },
    event: { label: 'Event', icon: '📸', color: '#f97316' },
    other: { label: 'Other', icon: '📋', color: '#6b7280' },
} as const;

export const EVENT_STATUSES = {
    scheduled: { label: 'Scheduled', icon: '⏰', color: '#3b82f6' },
    completed: { label: 'Completed', icon: '✅', color: '#10b981' },
    cancelled: { label: 'Cancelled', icon: '❌', color: '#ef4444' },
} as const;

class EventApi {
    /**
     * Get all events for the photographer
     */
    async getEvents(params?: GetEventsParams): Promise<GetEventsResponse> {
        const queryParams = new URLSearchParams();

        if (params?.clientId) queryParams.append('clientId', params.clientId);
        if (params?.startDate) queryParams.append('startDate', params.startDate.toISOString());
        if (params?.endDate) queryParams.append('endDate', params.endDate.toISOString());
        if (params?.type) queryParams.append('type', params.type);
        if (params?.status) queryParams.append('status', params.status);

        const response = await getWithAuth<GetEventsResponse>(
            `/api/events${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
        );

        return response;
    }

    /**
     * Get a single event by ID
     */
    async getEvent(eventId: string): Promise<Event> {
        const response = await getWithAuth<Event>(`/api/events/${eventId}`);
        return response;
    }

    /**
     * Create a new event
     */
    async createEvent(data: CreateEventDto): Promise<Event> {
        const response = await postWithAuth<Event>('/api/events', data);
        return response;
    }

    /**
     * Update an existing event (including drag-drop rescheduling)
     */
    async updateEvent(eventId: string, data: UpdateEventDto): Promise<Event> {
        const response = await putWithAuth<Event>(`/api/events/${eventId}`, data);
        return response;
    }

    /**
     * Delete an event
     */
    async deleteEvent(eventId: string): Promise<void> {
        await deleteWithAuth(`/api/events/${eventId}`);
    }
}

export const eventApi = new EventApi();
