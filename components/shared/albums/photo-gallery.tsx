'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon } from 'lucide-react';
import { PhotoCard } from './photo-card';
import type { Photo } from '@/lib/api/albums';

interface PhotoGalleryProps {
    photos: Photo[];
    selectedPhotos: Set<string>;
    onPhotoClick: (index: number) => void;
    onPhotoSelect: (photoId: string, e: React.MouseEvent) => void;
    hasSelection?: boolean;
}

export function PhotoGallery({
    photos,
    selectedPhotos,
    onPhotoClick,
    onPhotoSelect,
    hasSelection = false,
}: PhotoGalleryProps) {
    if (photos.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                        Upload your first photos to get started. Drag and drop or click "Add Photos"
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
            {photos.map((photo, index) => (
                <PhotoCard
                    key={photo._id}
                    photo={photo}
                    isSelected={selectedPhotos.has(photo._id)}
                    hasSelection={hasSelection}
                    onSelect={onPhotoSelect}
                    onClick={() => onPhotoClick(index)}
                />
            ))}
        </div>
    );
}
