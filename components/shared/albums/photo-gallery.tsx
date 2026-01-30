'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Flag, Image as ImageIcon } from 'lucide-react';
import { PhotoCard } from './photo-card';
import type { Photo, SharePermissions } from '@/lib/api/albums';
import { ImagePreview } from '../ImagePreview';
import Masonry from 'masonry-layout';
import imagesLoaded from 'imagesloaded';
import LightGallery from 'lightgallery/react';
import lgZoom from 'lightgallery/plugins/zoom';
import lgShare from 'lightgallery/plugins/share';
import lgHash from 'lightgallery/plugins/hash';


interface PhotoGalleryProps {
    photos: Photo[];
    selectedPhotos: Set<string>;
    onPhotoClick?: ((index: number) => void) | null;
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
    onPhotoClick = null,
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
    const lightGalleryRef = useRef<any>(null);

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

    useEffect(() => {
        // Ensure the DOM element exists
        const container = document.querySelector('.masonry-gallery-demo');
        console.log("dsfds", container);
        if (container) {
            // Initialize Masonry
            const msnry = new Masonry(container, {
                itemSelector: '.gallery-item',
                columnWidth: '.grid-sizer',
                percentPosition: true,
            });

            // Use imagesLoaded with Masonry
            imagesLoaded(container).on('progress', function () {
                // Layout Masonry after each image loads
                msnry.layout();
            });
        }
    }, []);

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
            <div
                className={'masonry-gallery-demo'}
            // plugins={[lgZoom, lgShare, lgHash]}
            // speed={500}
            >
                <div className="grid-sizer"></div>
                {photos.map((photo, index) => (
                    <div key={photo._id} className="lg-item gallery-item" data-src={null} data-sub-html={null}>
                        {/* <div className='absolute top-2 left-2 z-10'>{index + 1}</div> */}
                        <PhotoCard
                            key={photo._id}
                            photo={photo}
                            isSelected={selectedPhotos.has(photo._id) || photo.isClientSelected}
                            hasSelection={hasSelection}
                            onSelect={onPhotoSelect}
                            onClick={() => {
                                // e.stopPropagation();
                                // e.preventDefault();
                                handlePhotoClick(index)
                            }}
                            canDownload={canDownload}
                            onDownload={onDownload ? () => onDownload(photo) : undefined}
                        />
                    </div>
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
