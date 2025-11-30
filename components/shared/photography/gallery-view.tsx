'use client';

import React, { useState } from 'react';
import { Photo } from '@/types/photography';
import { Button } from '@/components/ui/button';
import { PhotoGrid } from './photo-grid';
import { PhotoViewer } from './photo-viewer';
import { Grid3x3, List, Download } from 'lucide-react';

interface GalleryViewProps {
  photos: Photo[];
  canDownload?: boolean;
  canFavorite?: boolean;
  onDownload?: (photoId: string) => void;
  onFavorite?: (photoId: string) => void;
  favorites?: Set<string>;
}

export function GalleryView({
  photos,
  canDownload = false,
  canFavorite = false,
  onDownload,
  onFavorite,
  favorites = new Set(),
}: GalleryViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const handleDownloadAll = async () => {
    if (!onDownload) return;
    photos.forEach(photo => onDownload(photo.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {photos.length} photo{photos.length !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-2">
          {canDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAll}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download All
            </Button>
          )}
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <PhotoGrid
        photos={photos}
        viewMode={viewMode}
        showFavorites={canFavorite}
        favorites={favorites}
        onFavorite={onFavorite}
        onPhotoClick={setSelectedPhoto}
      />

      {selectedPhoto && (
        <PhotoViewer
          photos={photos}
          initialPhotoId={selectedPhoto.id}
          isOpen={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          showFavorites={canFavorite}
          isFavorite={favorites.has(selectedPhoto.id)}
          onFavorite={onFavorite}
          canDownload={canDownload}
          onDownload={onDownload ? (photo) => onDownload(photo.id) : undefined}
        />
      )}
    </div>
  );
}
