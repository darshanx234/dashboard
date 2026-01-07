'use client';

import { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon } from 'lucide-react';
import { PhotoCard } from './photo-card';
import type { Photo, SharePermissions } from '@/lib/api/albums';
import { ImagePreview } from '../ImagePreview';

import LightGallery from 'lightgallery/react';

// import styles
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-thumbnail.css';

import lgThumbnail from 'lightgallery/plugins/thumbnail';


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

    const onInit = () => {
        console.log('lightGallery has been initialized');
    };

    return (
        <>
            <div className="">
                {/* {photos.map((photo, index) => (
                    <div key={photo._id} className="w-[calc(50%-8px)] md:w-[calc(33.333%-8px)] lg:w-[calc(25%-12px)]">
                        <div>{index + 1}</div>
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
                    </div>
                ))} */}
                <LightGallery
                    onInit={(detail) => {
                        lightGalleryRef.current = detail.instance;
                    }}
                    // dynamic={true}
                    speed={500}
                    plugins={[lgThumbnail]}
                    elementClassNames="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-4"
                    mode="lg-fade"
                    addClass="lg-zoom-from-origin"
                    startAnimationDuration={400}
                    backdropDuration={400}
                >
                    {photos.map((photo, index) => (
                        <a
                            key={index}
                            className="mb-4"
                            onClick={(e) => {
                                e.stopPropagation();
                                // openImagePreview(index);
                            }}
                            href={photo.url || photo.thumbnailUrl || ''}
                            data-src={photo.url || photo.thumbnailUrl || ''}
                            data-lg-size={photo.width + '-' + photo.height}
                        >
                            {index}
                            <img src={photo.thumbnailUrl} width={200} />
                            {/* <PhotoCard
                                key={photo._id}
                                photo={photo}
                                isSelected={selectedPhotos.has(photo._id) || photo.isClientSelected}
                                hasSelection={hasSelection}
                                onSelect={onPhotoSelect}
                                onClick={() => handlePhotoClick(index)}
                                canDownload={canDownload}
                                onDownload={onDownload ? () => onDownload(photo) : undefined}
                            /> */}
                        </a>
                    ))}
                </LightGallery>
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
