'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlbumCard } from '@/components/photography/album-card';
import { Plus, Image } from 'lucide-react';
import Link from 'next/link';

const mockAlbums = [
  {
    id: '1',
    user_id: 'user-1',
    title: 'Summer Wedding 2024',
    description: 'Beautiful outdoor wedding ceremony',
    date_taken: '2024-07-15',
    location: 'California Coast',
    privacy_setting: 'password_protected' as const,
    cover_photo_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    photo_count: 248,
  },
  {
    id: '2',
    user_id: 'user-1',
    title: 'Corporate Event',
    description: 'Annual company gala and awards ceremony',
    date_taken: '2024-06-20',
    location: 'Downtown Ballroom',
    privacy_setting: 'public' as const,
    cover_photo_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    photo_count: 156,
  },
  {
    id: '3',
    user_id: 'user-1',
    title: 'Family Portraits',
    description: 'Extended family session',
    date_taken: '2024-05-10',
    location: 'Studio',
    privacy_setting: 'private' as const,
    cover_photo_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    photo_count: 89,
  },
];

export default function PhotographerDashboard() {
  const [albums] = useState(mockAlbums);

  const handleShare = (album: any) => {
    console.log('Share album:', album.id);
  };

  const handleDelete = (albumId: string) => {
    console.log('Delete album:', albumId);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Albums</h1>
            <p className="text-muted-foreground mt-1">
              Manage your photo albums and share with clients
            </p>
          </div>
          <Link href="/photographer/albums/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Album
            </Button>
          </Link>
        </div>

        {albums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onShare={handleShare}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Image className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">No albums yet</CardTitle>
              <CardDescription className="mb-6">
                Create your first album to get started
              </CardDescription>
              <Link href="/photographer/albums/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Album
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Pro Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>✓ Use descriptive titles and dates to organize your albums</p>
            <p>✓ Set cover photos to make albums more visually appealing</p>
            <p>✓ Password protect albums for specific clients or events</p>
            <p>✓ Enable favorites to let clients mark their preferred photos</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
