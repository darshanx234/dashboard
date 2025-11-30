import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Eye, Image as ImageIcon, Calendar, FolderArchive } from 'lucide-react';

export default function DownloadsPage() {
  // Mock download history
  const downloads = [
    {
      id: 1,
      type: 'album' as const,
      title: 'Wedding - Sarah & John',
      itemCount: 245,
      photographer: 'John Photography Studio',
      downloadDate: '2024-11-03',
      fileSize: '1.2 GB',
    },
    {
      id: 2,
      type: 'single' as const,
      title: 'IMG_8756.jpg',
      albumTitle: 'Family Portrait Session',
      photographer: 'Jane Smith Photography',
      downloadDate: '2024-10-28',
      fileSize: '4.5 MB',
    },
    {
      id: 3,
      type: 'selection' as const,
      title: '12 Selected Photos',
      albumTitle: 'Wedding - Sarah & John',
      photographer: 'John Photography Studio',
      downloadDate: '2024-10-26',
      fileSize: '52 MB',
    },
  ];

  const totalDownloads = downloads.length;
  const totalSize = '1.26 GB';

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Downloads</h1>
            <p className="text-muted-foreground mt-2">
              Your download history and files
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalDownloads}</p>
                  <p className="text-xs text-muted-foreground">Total Downloads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FolderArchive className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalSize}</p>
                  <p className="text-xs text-muted-foreground">Total Size</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Download History */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Downloads</h2>
          
          {downloads.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="p-3 bg-muted rounded-lg">
                    {item.type === 'album' ? (
                      <FolderArchive className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold line-clamp-1">{item.title}</h3>
                        {item.type !== 'album' && item.albumTitle && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            from {item.albumTitle}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">{item.photographer}</p>
                      </div>

                      <div className="text-right">
                        <Badge variant="secondary">
                          {item.type === 'album' && `${item.itemCount} photos`}
                          {item.type === 'selection' && item.title}
                          {item.type === 'single' && 'Single photo'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.downloadDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {item.fileSize}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download Again
                        </Button>
                        {item.type !== 'single' && (
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Album
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {downloads.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Download className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No downloads yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Photos and albums you download will appear here for easy re-access.
              </p>
              <Button className="mt-4">Browse Albums</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
