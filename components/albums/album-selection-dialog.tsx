'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Search,
  ImageIcon,
  Calendar,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { albumApi, type Album } from '@/lib/api/albums';
import { useToast } from '@/hooks/use-toast';
import { ShareContent } from './share-content';
import { format } from 'date-fns';

interface AlbumSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialShowQR?: boolean;
}

export function AlbumSelectionDialog({ open, onOpenChange, initialShowQR = false }: AlbumSelectionDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  useEffect(() => {
    if (open && !selectedAlbum) {
      fetchAlbums();
    }
  }, [open, selectedAlbum]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAlbums(albums);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredAlbums(
        albums.filter(
          (album) =>
            album.title.toLowerCase().includes(query) ||
            album.description?.toLowerCase().includes(query) ||
            album.location?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, albums]);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const response = await albumApi.getAlbums({ status: 'published', limit: 100 });
      setAlbums(response.albums);
      setFilteredAlbums(response.albums);
    } catch (error: any) {
      console.error('Failed to fetch albums:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load albums',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAlbum = (album: Album) => {
    setSelectedAlbum(album);
  };

  const handleBack = () => {
    setSelectedAlbum(null);
  };

  const handleClose = () => {
    setSelectedAlbum(null);
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Show back button when an album is selected */}
        {selectedAlbum && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="absolute left-4 top-4 z-10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Albums
          </Button>
        )}

        {!selectedAlbum ? (
          <>
            <DialogHeader>
              <DialogTitle>Select Album to Share</DialogTitle>
              <DialogDescription>
                Choose an album to generate a share link or invite people
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              {/* Search Bar */}
              <div className="relative flex-shrink-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search albums by title, description, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Albums List */}
              <ScrollArea className="flex-1 pr-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredAlbums.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No albums found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchQuery
                        ? 'Try adjusting your search query'
                        : 'Create your first album to get started'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {filteredAlbums.map((album) => (
                      <Card
                        key={album._id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => handleSelectAlbum(album)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Cover Photo or Placeholder */}
                            <div className="relative aspect-video rounded-md overflow-hidden bg-muted flex items-center justify-center">
                              {album.coverPhoto ? (
                                <img
                                  src={album.coverPhoto}
                                  alt={album.title}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                              )}
                              {/* Status Badge */}
                              <div className="absolute top-2 right-2">
                                <Badge
                                  variant={
                                    album.status === 'published'
                                      ? 'default'
                                      : album.status === 'draft'
                                      ? 'secondary'
                                      : 'outline'
                                  }
                                >
                                  {album.status}
                                </Badge>
                              </div>
                            </div>

                            {/* Album Info */}
                            <div className="space-y-2">
                              <h3 className="font-semibold line-clamp-1">{album.title}</h3>
                              {album.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {album.description}
                                </p>
                              )}

                              {/* Metadata */}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  {album.totalPhotos} photos
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {album.totalViews} views
                                </div>
                                {album.shootDate && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(album.shootDate), 'MMM d, yyyy')}
                                  </div>
                                )}
                              </div>

                              {album.location && (
                                <p className="text-xs text-muted-foreground">
                                  📍 {album.location}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </>
        ) : (
          <div className="pt-12 overflow-y-auto flex-1">
            <ShareContent 
              albumId={selectedAlbum._id} 
              albumTitle={selectedAlbum.title}
              initialShowQR={initialShowQR}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
