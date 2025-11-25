'use client';

import { Event, EVENT_TYPES, EVENT_STATUSES } from '@/lib/api/events';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface EventCardProps {
    event: Event;
    clientName?: string;
    onClick?: () => void;
}

export function EventCard({ event, clientName, onClick }: EventCardProps) {
    const typeConfig = EVENT_TYPES[event.type];
    const statusConfig = EVENT_STATUSES[event.status];

    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    return (
        <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div
                    className="h-1 rounded-full mb-3"
                    style={{ backgroundColor: typeConfig.color }}
                />

                <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold line-clamp-1">{event.title}</h4>
                        <Badge
                            variant="secondary"
                            className="shrink-0"
                            style={{
                                backgroundColor: `${statusConfig.color}15`,
                                color: statusConfig.color,
                                borderColor: statusConfig.color,
                            }}
                        >
                            {statusConfig.icon}
                        </Badge>
                    </div>

                    {clientName && (
                        <p className="text-sm text-muted-foreground">
                            Client: {clientName}
                        </p>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span>
                            {format(startDate, 'MMM d, yyyy h:mm a')}
                            {startDate.toDateString() !== endDate.toDateString() &&
                                ` - ${format(endDate, 'MMM d, yyyy h:mm a')}`}
                        </span>
                    </div>

                    {event.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="line-clamp-1">{event.location}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                        <Badge variant="outline" className="text-xs">
                            {typeConfig.icon} {typeConfig.label}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
