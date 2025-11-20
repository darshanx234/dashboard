'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Image as ImageIcon, Grid3x3, List, Share2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { albumApi, type Album } from '@/lib/api/albums';
import { useToast } from '@/hooks/use-toast';
import { AlbumActionsMenu } from '@/components/albums/album-actions-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAlbumsAction } from '@/lib/actions/albums.action';

export default function AlbumsPage() {
  const { toast } = useToast();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const [stats, setStats] = useState({
    totalAlbums: 0,
    totalPhotos: 0,
    sharedAlbums: 0,
    totalViews: 0,
  });

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const response = await getAlbumsAction({ limit: 100 });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch albums');
      }

      const fetchedAlbums = response.data.albums;
      setAlbums(fetchedAlbums);

      console.log(fetchedAlbums);

      // Calculate stats
      const stats = {
        totalAlbums: fetchedAlbums.length,
        totalPhotos: fetchedAlbums.reduce((sum: number, album: Album) => sum + album.totalPhotos, 0),
        sharedAlbums: fetchedAlbums.filter((album: Album) => album.status === 'published').length,
        totalViews: fetchedAlbums.reduce((sum: number, album: Album) => sum + album.totalViews, 0),
      };
      setStats(stats);
    } catch (error: any) {
      console.error('Fetch albums error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load albums',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAlbumUpdated = (updatedAlbum: Album) => {
    setAlbums(albums.map((album: Album) => 
      album._id === updatedAlbum._id ? updatedAlbum : album
    ));
  };

  const handleAlbumDeleted = (albumId: string) => {
    setAlbums(albums.filter((album: Album) => album._id !== albumId));
    // Recalculate stats
    const remainingAlbums = albums.filter((album: Album) => album._id !== albumId);
    setStats({
      totalAlbums: remainingAlbums.length,
      totalPhotos: remainingAlbums.reduce((sum: number, album: Album) => sum + album.totalPhotos, 0),
      sharedAlbums: remainingAlbums.filter((album: Album) => album.status === 'published').length,
      totalViews: remainingAlbums.reduce((sum: number, album: Album) => sum + album.totalViews, 0),
    });
  };

  // Keep mock data structure for display
  const mockAlbums = [
    {
      id: 1,
      title: 'Wedding - Sarah & John',
      cover: null,
      photoCount: 245,
      createdAt: '2024-11-01',
      isShared: true,
      viewCount: 156,
    },
    {
      id: 2,
      title: 'Corporate Event - Tech Summit 2024',
      cover: null,
      photoCount: 89,
      createdAt: '2024-10-28',
      isShared: false,
      viewCount: 0,
    },
    {
      id: 3,
      title: 'Family Portrait - Johnson Family',
      cover: null,
      photoCount: 32,
      createdAt: '2024-10-25',
      isShared: true,
      viewCount: 48,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Albums</h1>
            <p className="text-muted-foreground mt-2">
              Create, manage, and share your photo albums
            </p>
          </div>
          <Button size="lg" asChild>
            <Link href="/albums/create">
              <Plus className="mr-2 h-5 w-5" />
              New Album
            </Link>
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Albums</CardDescription>
              <CardTitle className="text-3xl">{loading ? '...' : stats.totalAlbums}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Photos</CardDescription>
              <CardTitle className="text-3xl">{loading ? '...' : stats.totalPhotos}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Shared Albums</CardDescription>
              <CardTitle className="text-3xl">{loading ? '...' : stats.sharedAlbums}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Views</CardDescription>
              <CardTitle className="text-3xl">{loading ? '...' : stats.totalViews}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Grid3x3 className="mr-2 h-4 w-4" />
              Grid View
            </Button>
            <Button variant="ghost" size="sm">
              <List className="mr-2 h-4 w-4" />
              List View
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="photo-count">Photo Count</SelectItem>
                <SelectItem value="views">Views</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Albums Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : albums.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No albums yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                Create your first album to start organizing and sharing your photos
              </p>
              <Button asChild>
                <Link href="/albums/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Album
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <Link key={album._id} href={`/albums/${album._id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  {/* Album Cover */}
                  <div className="aspect-video bg-muted flex items-center justify-center border-b">
                    {album.coverPhoto ? (
                      <img src={album.coverPhoto} alt={album.title} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>

                  {/* Album Info */}
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{album.title}</CardTitle>
                    <CardDescription>
                      {album.totalPhotos} photos • Created {new Date(album.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>

                  {/* Album Actions */}
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {album.status === 'published' && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Published
                          </span>
                        )}
                        {album.totalViews > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {album.totalViews} views
                          </span>
                        )}
                      </div>
                      <AlbumActionsMenu
                        album={album}
                        onAlbumUpdated={handleAlbumUpdated}
                        onAlbumDeleted={handleAlbumDeleted}
                      />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
