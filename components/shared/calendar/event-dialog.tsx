'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Event,
    CreateEventDto,
    UpdateEventDto,
    EventType,
    EventStatus,
    EVENT_TYPES,
    EVENT_STATUSES,
} from '@/lib/api/events';
import { Client } from '@/lib/api/clients';
import { Loader2 } from 'lucide-react';

interface EventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event?: Event | null;
    clients: Client[];
    onSave: (data: CreateEventDto | UpdateEventDto) => Promise<void>;
    defaultDate?: Date;
}

export function EventDialog({
    open,
    onOpenChange,
    event,
    clients,
    onSave,
    defaultDate,
}: EventDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CreateEventDto>({
        clientId: '',
        title: '',
        description: '',
        type: 'other',
        status: 'scheduled',
        startDate: new Date(),
        endDate: new Date(),
        location: '',
        notes: '',
    });

    useEffect(() => {
        if (event) {
            setFormData({
                clientId: event.clientId,
                albumId: event.albumId,
                title: event.title,
                description: event.description || '',
                type: event.type,
                status: event.status,
                startDate: new Date(event.startDate),
                endDate: new Date(event.endDate),
                location: event.location || '',
                notes: event.notes || '',
            });
        } else {
            const start = defaultDate || new Date();
            const end = new Date(start);
            end.setHours(start.getHours() + 2);

            setFormData({
                clientId: '',
                title: '',
                description: '',
                type: 'other',
                status: 'scheduled',
                startDate: start,
                endDate: end,
                location: '',
                notes: '',
            });
        }
    }, [event, defaultDate, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onSave(formData);
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to save event:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof CreateEventDto, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const formatDateTimeLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{event ? 'Edit Event' : 'Create New Event'}</DialogTitle>
                    <DialogDescription>
                        {event
                            ? 'Update event details below.'
                            : 'Schedule a new event for your client.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Event Title *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                required
                                disabled={loading}
                                placeholder="e.g., Wedding Photoshoot"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="client">Client *</Label>
                                <Select
                                    value={formData.clientId}
                                    onValueChange={(value) => handleChange('clientId', value)}
                                    disabled={loading}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map((client) => (
                                            <SelectItem key={client._id} value={client._id}>
                                                {client.firstName} {client.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Event Type *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => handleChange('type', value as EventType)}
                                    disabled={loading}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(EVENT_TYPES).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                                {config.icon} {config.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date & Time *</Label>
                                <Input
                                    id="startDate"
                                    type="datetime-local"
                                    value={formatDateTimeLocal(formData.startDate)}
                                    onChange={(e) =>
                                        handleChange('startDate', new Date(e.target.value))
                                    }
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date & Time *</Label>
                                <Input
                                    id="endDate"
                                    type="datetime-local"
                                    value={formatDateTimeLocal(formData.endDate)}
                                    onChange={(e) =>
                                        handleChange('endDate', new Date(e.target.value))
                                    }
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => handleChange('status', value as EventStatus)}
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(EVENT_STATUSES).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>
                                            {config.icon} {config.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                                disabled={loading}
                                placeholder="e.g., Central Park, New York"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                rows={2}
                                disabled={loading}
                                placeholder="Brief description of the event"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                rows={3}
                                disabled={loading}
                                placeholder="Additional notes or requirements"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {event ? 'Update Event' : 'Create Event'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
