'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Image as ImageIcon,
    Loader2,
    Plus,
    Edit,
} from 'lucide-react';
import { Client, clientApi } from '@/lib/api/clients';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ClientDialog } from '@/components/shared/clients/client-dialog';

export default function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [client, setClient] = useState<Client | null>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [albums, setAlbums] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const clientId = params.id as string;

    useEffect(() => {
        loadClientData();
    }, [clientId]);

    const loadClientData = async () => {
        try {
            setLoading(true);
            const [clientData, eventsData, albumsData] = await Promise.all([
                clientApi.getClient(clientId),
                clientApi.getClientEvents(clientId),
                clientApi.getClientAlbums(clientId),
            ]);
            setClient(clientData);
            setEvents(eventsData);
            setAlbums(albumsData);
        } catch (error) {
            console.error('Failed to load client data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load client data.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateClient = async (data: any) => {
        try {
            await clientApi.updateClient(clientId, data);
            toast({
                title: 'Success',
                description: 'Client updated successfully.',
            });
            loadClientData();
        } catch (error) {
            console.error('Failed to update client:', error);
            toast({
                title: 'Error',
                description: 'Failed to update client.',
                variant: 'destructive',
            });
            throw error;
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </AppLayout>
        );
    }

    if (!client) {
        return (
            <AppLayout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-4">Client not found</h2>
                    <Button onClick={() => router.push('/clients')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Clients
                    </Button>
                </div>
            </AppLayout>
        );
    }

    const initials = `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase();
    const fullName = `${client.firstName} ${client.lastName}`;
    const isActive = events.length > 0 || albums.length > 0;

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/clients')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold">Client Details</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage client information, events, and albums
                        </p>
                    </div>
                    <Button onClick={() => setEditDialogOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Client
                    </Button>
                </div>

                {/* Client Info Card */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-start gap-6">
                            <Avatar className="h-20 w-20 bg-primary">
                                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-2xl">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-2xl font-bold">{fullName}</h2>
                                    {isActive && (
                                        <Badge variant="secondary">
                                            Active
                                        </Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                    {client.email && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Mail className="h-4 w-4" />
                                            <span>{client.email}</span>
                                        </div>
                                    )}
                                    {client.phone && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="h-4 w-4" />
                                            <span>{client.phone}</span>
                                        </div>
                                    )}
                                    {client.address && (
                                        <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                                            <MapPin className="h-4 w-4" />
                                            <span>{client.address}</span>
                                        </div>
                                    )}
                                </div>

                                {client.notes && (
                                    <div className="mt-4 p-4 bg-muted rounded-lg">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Notes</p>
                                        <p className="text-sm">{client.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="flex gap-4">
                                <div className="text-center">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-2xl font-bold">{albums.length}</p>
                                    <p className="text-xs text-muted-foreground">Albums</p>
                                </div>
                                <div className="text-center">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                                        <Calendar className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-2xl font-bold">{events.length}</p>
                                    <p className="text-xs text-muted-foreground">Events</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs for Events and Albums */}
                <Tabs defaultValue="events" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="events">Events ({events.length})</TabsTrigger>
                        <TabsTrigger value="albums">Albums ({albums.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="events" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Client Events</h3>
                            <Button asChild>
                                <Link href="/calendar">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Event
                                </Link>
                            </Button>
                        </div>

                        {events.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No events yet</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Create events for this client to get started.
                                    </p>
                                    <Button asChild>
                                        <Link href="/calendar">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Event
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {events.map((event) => (
                                    <Card key={event._id}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold">{event.title}</h4>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {new Date(event.startDate).toLocaleDateString()} -{' '}
                                                        {new Date(event.endDate).toLocaleDateString()}
                                                    </p>
                                                    {event.location && (
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            <MapPin className="h-3 w-3 inline mr-1" />
                                                            {event.location}
                                                        </p>
                                                    )}
                                                </div>
                                                <Badge>{event.status}</Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="albums" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Client Albums</h3>
                            <Button asChild>
                                <Link href="/albums">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Album
                                </Link>
                            </Button>
                        </div>

                        {albums.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No albums yet</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Create albums for this client to get started.
                                    </p>
                                    <Button asChild>
                                        <Link href="/albums">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Album
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {albums.map((album) => (
                                    <Link key={album._id} href={`/albums/${album._id}`}>
                                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                                            <CardContent className="p-4">
                                                {album.coverPhoto && (
                                                    <img
                                                        src={album.coverPhoto}
                                                        alt={album.title}
                                                        className="w-full h-40 object-cover rounded-lg mb-3"
                                                    />
                                                )}
                                                <h4 className="font-semibold">{album.title}</h4>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {album.totalPhotos} photos
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <ClientDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                client={client}
                onSave={handleUpdateClient}
            />
        </AppLayout>
    );
}
