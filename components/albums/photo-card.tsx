'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Heart, Check, Image as ImageIcon } from 'lucide-react';
import type { Photo } from '@/lib/api/albums';

interface PhotoCardProps {
    photo: Photo;
    isSelected: boolean;
    hasSelection?: boolean;
    onSelect: (photoId: string, e: React.MouseEvent) => void;
    onClick: () => void;
}

export function PhotoCard({ photo, isSelected, hasSelection = false, onSelect, onClick }: PhotoCardProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '50px', // Start loading 50px before the image enters viewport
            }
        );

        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
        };
    }, []);

    const handleCardClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // If in selection mode, clicking the card selects/deselects it
        if (hasSelection) {
            onSelect(photo._id, e);
        } else {
            // Otherwise, open the preview
            onClick();
        }
    };

    return (
        <div className="break-inside-avoid mb-4" onClick={handleCardClick}>
            <div
                ref={containerRef}
                className={`group relative overflow-hidden rounded-lg bg-muted hover:shadow-xl transition-all duration-300 cursor-pointer ${isSelected ? 'scale-95 opacity-70' : ''
                    }`}
            >
                {/* Selection Circle Button */}
                <div
                    className={`absolute top-3 left-3 z-20 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(photo._id, e);
                    }}
                >
                    <div
                        className={`w-6 h-6 rounded-full cursor-pointer flex items-center justify-center transition-all duration-200 ${isSelected
                                ? 'bg-primary border-2 border-primary shadow-lg'
                                : 'bg-white/10 border-2 border-white/50 hover:bg-white hover:border-white hover:scale-110'
                            }`}
                    >
                        {!isSelected && (
                            <Check className="h-4 w-4 text-transparent hover:scale-110 hover:text-primary" />
                        )}
                        {isSelected && <Check className="h-5 w-5 text-primary-foreground" />}
                    </div>
                </div>

                {photo.url || photo.thumbnailUrl ? (
                    <div className="relative w-full" style={{ aspectRatio: photo.width && photo.height ? `${photo.width}/${photo.height}` : '1/1' }}>
                        {/* Placeholder while loading */}
                        {!isLoaded && (
                            <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                        )}

                        {/* Actual image - only load when in view */}
                        {isInView && (
                            <img
                                ref={imgRef}
                                src={photo.thumbnailUrl || photo.url}
                                alt={photo.originalName}
                                className={`w-full h-full object-cover transition-all duration-300 ${isSelected ? 'scale-95' : 'group-hover:scale-105'
                                    } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                                loading="lazy"
                                onLoad={() => setIsLoaded(true)}
                            />
                        )}
                    </div>
                ) : (
                    <div className="w-full aspect-square flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {/* Photo Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <p className="text-xs font-medium truncate">{photo.originalName}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/80">
                            <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {photo.views}
                            </span>
                            <span className="flex items-center gap-1">
                                <Download className="h-3 w-3" />
                                {photo.downloads}
                            </span>
                            {photo.favoritesCount > 0 && (
                                <span className="flex items-center gap-1">
                                    <Heart className="h-3 w-3 fill-current" />
                                    {photo.favoritesCount}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClick();
                            }}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                const link = document.createElement('a');
                                link.href = photo.url || photo.thumbnailUrl || '';
                                link.download = photo.originalName;
                                link.click();
                            }}
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Favorite Badge */}
                {photo.favoritesCount > 0 && (
                    <Badge
                        variant="secondary"
                        className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm group-hover:opacity-0 transition-opacity"
                    >
                        <Heart className="h-3 w-3 mr-1 fill-current text-red-500" />
                        {photo.favoritesCount}
                    </Badge>
                )}
            </div>
        </div>
    );
}
