'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { ClientCard } from '@/components/shared/clients/client-card';
import { ClientDialog } from '@/components/shared/clients/client-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Client, clientApi, CreateClientDto, UpdateClientDto } from '@/lib/api/clients';
import { Plus, Search, Users, Calendar, Image, Loader2, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SortOption = 'name' | 'recent' | 'events' | 'albums';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadClients();
  }, [searchQuery]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await clientApi.getClients({
        search: searchQuery || undefined,
        limit: 100,
      });
      setClients(response.clients);

      // Load event counts for each client
      const counts: Record<string, number> = {};
      await Promise.all(
        response.clients.map(async (client) => {
          counts[client._id] = client.eventIds?.length || 0;
        })
      );
      setEventCounts(counts);
    } catch (error) {
      console.error('Failed to load clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clients. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setDialogOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setDialogOpen(true);
  };

  const handleSaveClient = async (data: CreateClientDto | UpdateClientDto) => {
    try {
      if (selectedClient) {
        await clientApi.updateClient(selectedClient._id, data);
        toast({
          title: 'Success',
          description: 'Client updated successfully.',
        });
      } else {
        await clientApi.createClient(data as CreateClientDto);
        toast({
          title: 'Success',
          description: 'Client created successfully.',
        });
      }
      loadClients();
    } catch (error) {
      console.error('Failed to save client:', error);
      toast({
        title: 'Error',
        description: 'Failed to save client. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      await clientApi.deleteClient(clientToDelete._id);
      toast({
        title: 'Success',
        description: 'Client deleted successfully.',
      });
      loadClients();
    } catch (error) {
      console.error('Failed to delete client:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete client. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  // Calculate stats
  const totalAlbums = clients.reduce((sum, client) => sum + (client.albumIds?.length || 0), 0);
  const totalEvents = clients.reduce((sum, client) => sum + (client.eventIds?.length || 0), 0);
  const activeClients = clients.filter(client => (client.eventIds?.length || 0) > 0).length;

  // Sort clients
  const sortedClients = [...clients].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      case 'events':
        return (b.eventIds?.length || 0) - (a.eventIds?.length || 0);
      case 'albums':
        return (b.albumIds?.length || 0) - (a.albumIds?.length || 0);
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground mt-2">
              Manage your clients and their linked albums & events
            </p>
          </div>
          <Button onClick={handleAddClient}>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-3xl font-bold mt-2">{clients.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                <p className="text-3xl font-bold mt-2">{activeClients}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Albums</p>
                <p className="text-3xl font-bold mt-2">{totalAlbums}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Image className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                <p className="text-3xl font-bold mt-2">{totalEvents}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="events">Most Events</SelectItem>
              <SelectItem value="albums">Most Albums</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Client List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sortedClients.length === 0 ? (
          <div className="border rounded-lg p-12 bg-card text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No clients yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? 'No clients match your search.'
                : 'Get started by adding your first client.'}
            </p>
            {!searchQuery && (
              <Button onClick={handleAddClient}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Client
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedClients.map((client) => (
              <ClientCard
                key={client._id}
                client={client}
                onEdit={handleEditClient}
                onDelete={handleDeleteClient}
                eventsCount={eventCounts[client._id] || 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={selectedClient}
        onSave={handleSaveClient}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {clientToDelete?.firstName}{' '}
              {clientToDelete?.lastName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
