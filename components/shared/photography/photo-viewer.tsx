'use client';

import React, { useState, useCallback } from 'react';
import { Photo } from '@/types/photography';
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, X, Heart, Info } from 'lucide-react';

interface PhotoViewerProps {
  photos: Photo[];
  initialPhotoId: string;
  isOpen: boolean;
  onClose: () => void;
  showFavorites?: boolean;
  isFavorite?: boolean;
  onFavorite?: (photoId: string) => void;
  canDownload?: boolean;
  onDownload?: (photo: Photo) => void;
}

export function PhotoViewer({
  photos,
  initialPhotoId,
  isOpen,
  onClose,
  showFavorites = false,
  isFavorite = false,
  onFavorite,
  canDownload = false,
  onDownload,
}: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(
    photos.findIndex(p => p.id === initialPhotoId) || 0
  );
  const [showInfo, setShowInfo] = useState(false);

  const currentPhoto = photos[currentIndex];

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
    },
    [handlePrevious, handleNext, onClose]
  );

  React.useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none">
        <DialogHeader className="absolute top-4 left-4 right-4 z-10 flex flex-row items-center justify-between bg-none border-none p-0">
          <div className="text-white text-sm font-medium">
            {currentIndex + 1} / {photos.length}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="relative w-full aspect-video flex items-center justify-center">
          <img
            src={currentPhoto.file_url}
            alt="Photo"
            className="max-h-full max-w-full object-contain"
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="absolute left-4 text-white hover:bg-white/20"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="absolute right-4 text-white hover:bg-white/20"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex items-center justify-between px-4 py-3 bg-black/50 border-t border-white/10">
          <div className="flex items-center gap-2">
            {showFavorites && onFavorite && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onFavorite(currentPhoto.id)}
                className={`text-white ${
                  isFavorite ? 'text-red-500' : 'hover:bg-white/20'
                }`}
              >
                <Heart
                  className="h-4 w-4"
                  fill={isFavorite ? 'currentColor' : 'none'}
                />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInfo(!showInfo)}
              className="text-white hover:bg-white/20"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>

          {canDownload && onDownload && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDownload(currentPhoto)}
              className="text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showInfo && (
          <div className="px-4 py-3 bg-black/50 border-t border-white/10 text-white text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uploaded:</span>
              <span>{new Date(currentPhoto.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">File Size:</span>
              <span>{(currentPhoto.file_size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            {currentPhoto.width && currentPhoto.height && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dimensions:</span>
                <span>
                  {currentPhoto.width}x{currentPhoto.height}
                </span>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
