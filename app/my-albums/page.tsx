import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Download, Grid3x3, Image as ImageIcon, ZoomIn } from 'lucide-react';

export default function MyAlbumsPage() {
  // Mock data for client view
  const sharedAlbums = [
    {
      id: 1,
      title: 'Wedding - Sarah & John',
      photographer: 'John Photography Studio',
      cover: null,
      photoCount: 245,
      sharedDate: '2024-11-01',
      favoriteCount: 8,
      downloadedCount: 12,
    },
    {
      id: 2,
      title: 'Family Portrait Session',
      photographer: 'Jane Smith Photography',
      cover: null,
      photoCount: 32,
      sharedDate: '2024-10-25',
      favoriteCount: 5,
      downloadedCount: 32,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">My Albums</h1>
          <p className="text-muted-foreground mt-2">
            Albums shared with you by photographers
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{sharedAlbums.length}</p>
                  <p className="text-xs text-muted-foreground">Shared Albums</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">13</p>
                  <p className="text-xs text-muted-foreground">Favorite Photos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Download className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">44</p>
                  <p className="text-xs text-muted-foreground">Downloaded</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Albums Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sharedAlbums.map((album) => (
            <Card key={album.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              {/* Album Cover */}
              <div className="aspect-video bg-muted flex items-center justify-center border-b relative">
                {album.cover ? (
                  <img src={album.cover} alt={album.title} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-xs">
                    {album.photoCount} photos
                  </Badge>
                </div>
              </div>

              {/* Album Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold line-clamp-1">{album.title}</h3>
                  <p className="text-sm text-muted-foreground">{album.photographer}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {album.favoriteCount} favorites
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {album.downloadedCount} downloaded
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Shared {new Date(album.sharedDate).toLocaleDateString()}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" size="sm">
                    <ZoomIn className="mr-2 h-4 w-4" />
                    View Album
                  </Button>
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {sharedAlbums.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No albums yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Albums shared with you by photographers will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
