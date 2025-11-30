'use client';

import React, { useState } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GalleryView } from '@/components/photography/gallery-view';
import { Lock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const mockPhotos = [
  {
    id: '1',
    album_id: 'album-1',
    file_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600',
    thumbnail_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200',
    file_size: 2048000,
    width: 1920,
    height: 1280,
    order_index: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    album_id: 'album-1',
    file_url: 'https://images.pexels.com/photos/1263365/pexels-photo-1263365.jpeg?auto=compress&cs=tinysrgb&w=600',
    thumbnail_url: 'https://images.pexels.com/photos/1263365/pexels-photo-1263365.jpeg?auto=compress&cs=tinysrgb&w=200',
    file_size: 1856000,
    width: 1920,
    height: 1280,
    order_index: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    album_id: 'album-1',
    file_url: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=600',
    thumbnail_url: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=200',
    file_size: 1920000,
    width: 1920,
    height: 1280,
    order_index: 2,
    created_at: new Date().toISOString(),
  },
];

export default function GalleryPage({ params }: { params: { token: string } }) {
  const [isPasswordProtected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!isPasswordProtected);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Authenticating with password:', password);
      setIsAuthenticated(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = (photoId: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const handleDownload = (photoId: string) => {
    const photo = mockPhotos.find(p => p.id === photoId);
    if (photo) {
      console.log('Downloading photo:', photoId);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-8 w-8 mx-auto mb-2 text-primary" />
            <CardTitle>Album Password</CardTitle>
            <CardDescription>
              This album is password protected. Please enter the password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Access Album
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 py-4 lg:px-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <span className="text-muted-foreground">Gallery</span>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <span className="font-medium">Summer Wedding 2024</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <main className="p-4 lg:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Summer Wedding 2024</h1>
            <p className="text-muted-foreground mt-1">
              Beautiful outdoor wedding ceremony · California Coast · 248 photos
            </p>
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base">Album Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Date: July 15, 2024</p>
              <p>Location: California Coast</p>
              <p>Total Photos: 248</p>
            </CardContent>
          </Card>

          <GalleryView
            photos={mockPhotos}
            canDownload={true}
            canFavorite={true}
            favorites={favorites}
            onFavorite={handleFavorite}
            onDownload={handleDownload}
          />
        </div>
      </main>
    </div>
  );
}
