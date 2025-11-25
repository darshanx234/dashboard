'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Calendar, momentLocalizer, View, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar.css';
import { Event, eventApi, CreateEventDto, UpdateEventDto, EVENT_TYPES } from '@/lib/api/events';
import { Client, clientApi } from '@/lib/api/clients';
import { EventDialog } from '@/components/calendar/event-dialog';
import { CalendarToolbar } from '@/components/calendar/calendar-toolbar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const localizer = momentLocalizer(moment);

interface CalendarEvent extends Event {
    start: Date;
    end: Date;
}

export default function CalendarPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>('month');
    const [date, setDate] = useState(new Date());
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
    const [defaultDate, setDefaultDate] = useState<Date | undefined>();
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [eventsResponse, clientsResponse] = await Promise.all([
                eventApi.getEvents(),
                clientApi.getClients({ limit: 1000 }),
            ]);

            const calendarEvents: CalendarEvent[] = eventsResponse.events.map((event) => ({
                ...event,
                start: new Date(event.startDate),
                end: new Date(event.endDate),
            }));

            setEvents(calendarEvents);
            setClients(clientsResponse.clients);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load calendar data.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
        setDefaultDate(slotInfo.start as Date);
        setSelectedEvent(null);
        setDialogOpen(true);
    }, []);

    const handleSelectEvent = useCallback((event: CalendarEvent) => {
        setSelectedEvent(event);
        setDefaultDate(undefined);
        setDialogOpen(true);
    }, []);

    const handleSaveEvent = async (data: CreateEventDto | UpdateEventDto) => {
        try {
            if (selectedEvent) {
                await eventApi.updateEvent(selectedEvent._id, data);
                toast({
                    title: 'Success',
                    description: 'Event updated successfully.',
                });
            } else {
                await eventApi.createEvent(data as CreateEventDto);
                toast({
                    title: 'Success',
                    description: 'Event created successfully.',
                });
            }
            // Refresh events and switch to agenda view
            await loadData();
            setView('agenda');
        } catch (error) {
            console.error('Failed to save event:', error);
            toast({
                title: 'Error',
                description: 'Failed to save event.',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const handleDeleteEvent = (event: Event) => {
        setEventToDelete(event);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!eventToDelete) return;

        try {
            await eventApi.deleteEvent(eventToDelete._id);
            toast({
                title: 'Success',
                description: 'Event deleted successfully.',
            });
            loadData();
        } catch (error) {
            console.error('Failed to delete event:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete event.',
                variant: 'destructive',
            });
        } finally {
            setDeleteDialogOpen(false);
            setEventToDelete(null);
        }
    };

    const eventStyleGetter = useCallback((event: CalendarEvent) => {
        const typeConfig = EVENT_TYPES[event.type];
        return {
            style: {
                backgroundColor: typeConfig.color,
                borderColor: typeConfig.color,
                color: 'white',
            },
        };
    }, []);

    const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
        const newDate = new Date(date);

        if (action === 'TODAY') {
            setDate(new Date());
        } else if (action === 'PREV') {
            if (view === 'month') {
                newDate.setMonth(newDate.getMonth() - 1);
            } else if (view === 'week') {
                newDate.setDate(newDate.getDate() - 7);
            } else if (view === 'day') {
                newDate.setDate(newDate.getDate() - 1);
            }
            setDate(newDate);
        } else if (action === 'NEXT') {
            if (view === 'month') {
                newDate.setMonth(newDate.getMonth() + 1);
            } else if (view === 'week') {
                newDate.setDate(newDate.getDate() + 7);
            } else if (view === 'day') {
                newDate.setDate(newDate.getDate() + 1);
            }
            setDate(newDate);
        }
    };

    const calendarLabel = useMemo(() => {
        if (view === 'month') {
            return moment(date).format('MMMM YYYY');
        } else if (view === 'week') {
            const start = moment(date).startOf('week');
            const end = moment(date).endOf('week');
            return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
        } else if (view === 'day') {
            return moment(date).format('MMMM D, YYYY');
        }
        return '';
    }, [date, view]);

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Calendar</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your event schedule and bookings
                    </p>
                </div>

                <CalendarToolbar
                    view={view}
                    onViewChange={setView}
                    onNavigate={handleNavigate}
                    label={calendarLabel}
                    onAddEvent={() => {
                        setSelectedEvent(null);
                        setDefaultDate(undefined);
                        setDialogOpen(true);
                    }}
                />

                <div className="calendar-container">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        titleAccessor="title"
                        view={view}
                        onView={setView}
                        date={date}
                        onNavigate={setDate}
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        eventPropGetter={eventStyleGetter}
                        selectable
                        popup
                        style={{ height: 'calc(100vh - 400px)', minHeight: '500px' }}
                        views={['month', 'week', 'day', 'agenda']}
                        toolbar={false}
                    />
                </div>
            </div>

            <EventDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                event={selectedEvent}
                clients={clients}
                onSave={handleSaveEvent}
                defaultDate={defaultDate}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this event? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>

    );
}
