'use client';

import React from 'react';
import { Photo } from '@/types/photography';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Trash2, Heart } from 'lucide-react';

interface PhotoGridProps {
  photos: Photo[];
  showSelection?: boolean;
  selectedPhotos?: Set<string>;
  onSelectPhoto?: (photoId: string) => void;
  onSelectAll?: (selected: boolean) => void;
  showFavorites?: boolean;
  favorites?: Set<string>;
  onFavorite?: (photoId: string) => void;
  onDelete?: (photoId: string) => void;
  viewMode?: 'grid' | 'list';
  onPhotoClick?: (photo: Photo) => void;
}

export function PhotoGrid({
  photos,
  showSelection = false,
  selectedPhotos = new Set(),
  onSelectPhoto,
  onSelectAll,
  showFavorites = false,
  favorites = new Set(),
  onFavorite,
  onDelete,
  viewMode = 'grid',
  onPhotoClick,
}: PhotoGridProps) {
  const isAllSelected = photos.length > 0 && photos.every(p => selectedPhotos.has(p.id));

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {showSelection && (
          <div className="flex items-center gap-2 pb-4 border-b">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={onSelectAll}
              aria-label="Select all photos"
            />
            <span className="text-sm text-muted-foreground">
              {selectedPhotos.size} selected
            </span>
          </div>
        )}
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="flex items-center gap-4 p-3 border rounded-lg hover:bg-accent transition-colors"
          >
            {showSelection && (
              <Checkbox
                checked={selectedPhotos.has(photo.id)}
                onCheckedChange={() => onSelectPhoto?.(photo.id)}
              />
            )}
            <img
              src={photo.thumbnail_url}
              alt="Photo"
              className="h-16 w-16 object-cover rounded cursor-pointer"
              onClick={() => onPhotoClick?.(photo)}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {new Date(photo.created_at).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {(photo.file_size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div className="flex items-center gap-2">
              {showFavorites && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onFavorite?.(photo.id)}
                  className={favorites.has(photo.id) ? 'text-red-500' : ''}
                >
                  <Heart
                    className="h-4 w-4"
                    fill={favorites.has(photo.id) ? 'currentColor' : 'none'}
                  />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(photo.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showSelection && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={onSelectAll}
            aria-label="Select all photos"
          />
          <span className="text-sm text-muted-foreground">
            {selectedPhotos.size} selected
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden bg-muted">
            {showSelection && (
              <Checkbox
                checked={selectedPhotos.has(photo.id)}
                onCheckedChange={() => onSelectPhoto?.(photo.id)}
                className="absolute top-2 left-2 z-10"
              />
            )}
            <img
              src={photo.thumbnail_url}
              alt="Photo"
              className="w-full h-full object-cover cursor-pointer group-hover:brightness-75 transition-all"
              onClick={() => onPhotoClick?.(photo)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
              <div className="flex gap-1">
                {showFavorites && (
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFavorite?.(photo.id);
                    }}
                    className={favorites.has(photo.id) ? 'bg-red-500 hover:bg-red-600' : ''}
                  >
                    <Heart
                      className="h-4 w-4"
                      fill={favorites.has(photo.id) ? 'currentColor' : 'none'}
                    />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(photo.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
