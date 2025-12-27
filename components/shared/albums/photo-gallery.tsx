'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon } from 'lucide-react';
import { PhotoCard } from './photo-card';
import type { Photo, SharePermissions } from '@/lib/api/albums';
import { ImagePreview } from '../ImagePreview';

interface PhotoGalleryProps {
    photos: Photo[];
    selectedPhotos: Set<string>;
    onPhotoClick?: (index: number) => void;
    onPhotoSelect: (photoId: string, e: React.MouseEvent) => void;
    hasSelection?: boolean;
    canDownload?: boolean;
    onDownload?: (photo: Photo) => void;
    // Props for internal ImagePreview
    useInternalPreview?: boolean;
    permissions?: SharePermissions | null;
    clientId?: string | null;
    token?: string;
    photoFavorites?: Record<string, boolean>;
    photoComments?: Record<string, any[]>;
    onFavoriteToggle?: (photoId: string, isFavorite: boolean) => Promise<void>;
    onAddComment?: (photoId: string, comment: string) => Promise<void>;
    onSelectionToggle?: (photoId: string, isSelected: boolean) => Promise<void>;
}

export function PhotoGallery({
    photos,
    selectedPhotos,
    onPhotoClick,
    onPhotoSelect,
    hasSelection = false,
    canDownload = true,
    onDownload,
    useInternalPreview = false,
    permissions = null,
    clientId = null,
    token = '',
    photoFavorites = {},
    photoComments = {},
    onFavoriteToggle,
    onAddComment,
    onSelectionToggle,
}: PhotoGalleryProps) {
    // Internal preview state
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);

    const handlePhotoClick = (index: number) => {
        if (onPhotoClick) {
            onPhotoClick(index);
        } else if (useInternalPreview) {
            setPreviewIndex(index);
            setPreviewOpen(true);
            document.body.style.overflow = 'hidden';
        }
    };

    const closeInternalPreview = () => {
        setPreviewOpen(false);
        document.body.style.overflow = 'unset';
    };

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
        <>
            <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
                {photos.map((photo, index) => (
                    <PhotoCard
                        key={photo._id}
                        photo={photo}
                        isSelected={selectedPhotos.has(photo._id) || photo.isClientSelected}
                        hasSelection={hasSelection}
                        onSelect={onPhotoSelect}
                        onClick={() => handlePhotoClick(index)}
                        canDownload={canDownload}
                        onDownload={onDownload ? () => onDownload(photo) : undefined}
                    />
                ))}
            </div>

            {useInternalPreview && (
                <ImagePreview
                    isOpen={previewOpen}
                    currentIndex={previewIndex}
                    photos={photos}
                    permissions={permissions}
                    clientId={clientId}
                    token={token}
                    photoFavorites={photoFavorites}
                    photoComments={photoComments}
                    onClose={closeInternalPreview}
                    onNavigate={setPreviewIndex}
                    onDownload={onDownload || (() => { })}
                    onFavoriteToggle={onFavoriteToggle || (async () => { })}
                    onAddComment={onAddComment || (async () => { })}
                    onSelectionToggle={onSelectionToggle || (async () => { })}
                />
            )}
        </>
    );
}
