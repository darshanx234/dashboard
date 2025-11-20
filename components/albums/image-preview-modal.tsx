'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    X,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    Download,
    Eye,
    Heart,
} from 'lucide-react';
import type { Photo } from '@/lib/api/albums';

interface ImagePreviewModalProps {
    photos: Photo[];
    currentIndex: number;
    zoom: number;
    isOpen: boolean;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetZoom: () => void;
}

export function ImagePreviewModal({
    photos,
    currentIndex,
    zoom,
    isOpen,
    onClose,
    onNext,
    onPrev,
    onZoomIn,
    onZoomOut,
    onResetZoom,
}: ImagePreviewModalProps) {
    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    onPrev();
                    break;
                case 'ArrowRight':
                    onNext();
                    break;
                case '+':
                case '=':
                    onZoomIn();
                    break;
                case '-':
                case '_':
                    onZoomOut();
                    break;
                case '0':
                    onResetZoom();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, onNext, onPrev, onZoomIn, onZoomOut, onResetZoom]);

    // Manage body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || photos.length === 0) return null;

    const currentPhoto = photos[currentIndex];

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            style={{ margin: 0 }}
        >
            {/* Close Button */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/10 h-10 w-10"
                onClick={onClose}
            >
                <X className="h-6 w-6" />
            </Button>

            {/* Image Counter */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-white text-sm font-medium">
                    {currentIndex + 1} / {photos.length}
                </span>
            </div>

            {/* Navigation Buttons */}
            {photos.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/10 h-12 w-12"
                        onClick={onPrev}
                    >
                        <ChevronLeft className="h-8 w-8" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/10 h-12 w-12"
                        onClick={onNext}
                    >
                        <ChevronRight className="h-8 w-8" />
                    </Button>
                </>
            )}

            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 h-10 w-10"
                    onClick={onZoomOut}
                    disabled={zoom <= 0.5}
                >
                    <ZoomOut className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 px-3"
                    onClick={onResetZoom}
                >
                    {Math.round(zoom * 100)}%
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 h-10 w-10"
                    onClick={onZoomIn}
                    disabled={zoom >= 3}
                >
                    <ZoomIn className="h-5 w-5" />
                </Button>
            </div>

            {/* Image Info and Actions */}
            <div className="absolute bottom-4 left-4 z-10 max-w-md">
                <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
                    <h3 className="font-semibold text-sm mb-2">{currentPhoto?.originalName}</h3>
                    <div className="flex items-center gap-4 text-xs text-white/80">
                        <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {currentPhoto?.views}
                        </span>
                        <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {currentPhoto?.downloads}
                        </span>
                        {currentPhoto?.favoritesCount > 0 && (
                            <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3 fill-current" />
                                {currentPhoto?.favoritesCount}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2 mt-3">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = currentPhoto.url || currentPhoto.thumbnailUrl || '';
                                link.download = currentPhoto.originalName;
                                link.click();
                            }}
                        >
                            <Download className="h-3 w-3 mr-1.5" />
                            Download
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Image Container */}
            <div className="relative w-full h-full flex items-center justify-center p-20 overflow-auto">
                <img
                    src={currentPhoto?.url || currentPhoto?.thumbnailUrl}
                    alt={currentPhoto?.originalName}
                    className="max-w-full max-h-full object-contain transition-transform duration-200"
                    style={{
                        transform: `scale(${zoom})`,
                        cursor: zoom > 1 ? 'grab' : 'default',
                    }}
                    draggable={false}
                />
            </div>

            {/* Keyboard Shortcuts Info */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-1.5 text-white/60 text-xs">
                    Use arrow keys to navigate • ESC to close • +/- to zoom
                </div>
            </div>
        </div>
    );
}
