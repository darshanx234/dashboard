import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Download, Eye, X, Grid3x3, List, Image as ImageIcon } from 'lucide-react';

export default function FavoritesPage() {
  // Mock favorite photos
  const favorites = [
    {
      id: 1,
      albumTitle: 'Wedding - Sarah & John',
      photographer: 'John Photography Studio',
      thumbnail: null,
      addedDate: '2024-11-02',
    },
    {
      id: 2,
      albumTitle: 'Wedding - Sarah & John',
      photographer: 'John Photography Studio',
      thumbnail: null,
      addedDate: '2024-11-02',
    },
    {
      id: 3,
      albumTitle: 'Family Portrait Session',
      photographer: 'Jane Smith Photography',
      thumbnail: null,
      addedDate: '2024-10-26',
    },
    {
      id: 4,
      albumTitle: 'Wedding - Sarah & John',
      photographer: 'John Photography Studio',
      thumbnail: null,
      addedDate: '2024-11-01',
    },
    {
      id: 5,
      albumTitle: 'Family Portrait Session',
      photographer: 'Jane Smith Photography',
      thumbnail: null,
      addedDate: '2024-10-25',
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Favorites</h1>
            <p className="text-muted-foreground mt-2">
              {favorites.length} photos you've marked as favorites
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Grid3x3 className="h-4 w-4 mr-2" />
              Grid View
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          </div>
        </div>

        {/* Favorites Grid */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {favorites.map((photo) => (
            <Card key={photo.id} className="overflow-hidden group relative">
              {/* Photo Thumbnail */}
              <div className="aspect-square bg-muted flex items-center justify-center relative">
                {photo.thumbnail ? (
                  <img src={photo.thumbnail} alt="Favorite" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive">
                    <Heart className="h-4 w-4 fill-current" />
                  </Button>
                </div>
              </div>

              {/* Photo Info */}
              <CardContent className="p-3">
                <p className="text-sm font-medium line-clamp-1">{photo.albumTitle}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{photo.photographer}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Added {new Date(photo.addedDate).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {favorites.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Heart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Photos you mark as favorites will appear here for easy access.
              </p>
              <Button className="mt-4">Browse Albums</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
