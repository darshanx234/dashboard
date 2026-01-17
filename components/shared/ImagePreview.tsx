// 'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    Heart,
    X,
    MessageCircle,
    Info,
    MoreVertical,
    Download,
    ChevronLeft,
    ChevronRight,
    Check,
    CircleChevronRight,
    CircleChevronLeft,
} from 'lucide-react';
import { type Photo, type SharePermissions } from '@/lib/api/albums';
import { PhotoFavoriteButton } from '@/components/shared/PhotoFavoriteButton';
import { PhotoCommentSection } from '@/components/shared/PhotoCommentSection';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import useEmblaCarousel from 'embla-carousel-react'
import { LazyLoadImage } from './LazyLoadImage';
import { EmblaCarouselType } from 'embla-carousel'

interface ImagePreviewProps {
    isOpen: boolean;
    currentIndex: number;
    photos: Photo[];
    permissions: SharePermissions | null;
    clientId: string | null;
    token: string;
    photoFavorites: Record<string, boolean>;
    photoComments: Record<string, any[]>;
    onClose: () => void;
    onNavigate: (index: number) => void;
    onDownload: (photo: Photo) => void;
    onFavoriteToggle: (photoId: string, isFavorite: boolean) => Promise<void>;
    onAddComment: (photoId: string, comment: string) => Promise<void>;
    onSelectionToggle: (photoId: string, isSelected: boolean) => Promise<void>;
}

type DrawerType = 'activity' | 'info' | null;

export function ImagePreview({
    isOpen,
    currentIndex,
    photos,
    permissions,
    clientId,
    token,
    photoFavorites,
    photoComments,
    onClose,
    onNavigate,
    onDownload,
    onFavoriteToggle,
    onAddComment,
    onSelectionToggle,
}: ImagePreviewProps) {
    const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(currentIndex);
    const [slidesInView, setSlidesInView] = useState<number[]>([])
    const [zoom, setZoom] = useState(1);
    const imageRef = useRef<HTMLImageElement>(null);
    const [emblaRef, emblaApi] = useEmblaCarousel({
        startIndex: currentIndex
    });

    const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
        containScroll: 'keepSnaps',
        dragFree: true
    });

    const onSelect = useCallback(() => {
        if (!emblaApi || !emblaThumbsApi) return
        setCurrentPhotoIndex(emblaApi.selectedScrollSnap())
        emblaThumbsApi.scrollTo(emblaApi.selectedScrollSnap())
    }, [emblaApi, emblaThumbsApi, setCurrentPhotoIndex]);

    const updateSlidesInView = useCallback((emblaApi: EmblaCarouselType) => {
        setSlidesInView((slidesInView) => {
            console.log("slidesInView", emblaApi.slidesInView());
            if (slidesInView.length === emblaApi.slideNodes().length) {
                emblaApi.off('slidesInView', updateSlidesInView)
            }
            const inView = emblaApi
                .slidesInView()
                .filter((index) => !slidesInView.includes(index))
            return slidesInView.concat(inView)
            // return inView;
        })
    }, [])

    useEffect(() => {
        if (!emblaApi) return;
        updateSlidesInView(emblaApi);
        emblaApi.on('slidesInView', updateSlidesInView)
        emblaApi.on('reInit', updateSlidesInView)
        emblaApi.on('select', onSelect);
        onSelect();

        return () => {
            emblaApi.off('select', onSelect);
        };
    }, [emblaApi]);
    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev()
    }, [emblaApi])

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext()
    }, [emblaApi]);

    const onThumbClick = useCallback(
        (index: number) => {
            if (!emblaApi || !emblaThumbsApi) return
            emblaApi.scrollTo(index)
        },
        [emblaApi, emblaThumbsApi]
    )

    const currentPhoto = photos[currentPhotoIndex];

    useEffect(() => {
        if (!isOpen) {
            setActiveDrawer(null);
            setZoom(1);
        }
    }, [isOpen]);

    useEffect(() => {
        setCurrentPhotoIndex(currentIndex);
    }, [currentIndex]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                if (activeDrawer) {
                    setActiveDrawer(null);
                } else {
                    onClose();
                }
            } else if (e.key === 'ArrowLeft') {
                if (emblaApi) emblaApi.scrollPrev()
            } else if (e.key === 'ArrowRight') {
                if (emblaApi) emblaApi.scrollNext()
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, activeDrawer, currentPhotoIndex]);

    if (!isOpen || !currentPhoto) return null;

    return (
        <div className="fixed inset-0 z-[100] backdrop-blur-sm bg-black/80 flex flex-col" style={{ margin: 0 }}>
            {/* Top Bar */}
            <div className="border-b border-gray-600 p-4 shrink-0">

                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/10 h-10 w-10"
                        onClick={onClose}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                    {/* Image Counter */}
                    <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                        <span className="text-white text-sm font-medium">
                            {currentPhotoIndex + 1} / {photos.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={currentPhoto.isClientSelected ? "default" : "ghost"}
                            size="icon"
                            className={`h-10 w-10 ${currentPhoto.isClientSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-white hover:bg-white/10'}`}
                            onClick={async () => {
                                await onSelectionToggle(currentPhoto._id, !currentPhoto.isClientSelected);
                            }}
                            title={currentPhoto.isClientSelected ? "Selected" : "Select Photo"}
                        >
                            <Check className="h-5 w-5" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10 h-10 w-10"
                            onClick={() => setActiveDrawer(activeDrawer === 'info' ? null : 'info')}
                        >
                            <Info className="h-5 w-5" />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild style={{ zIndex: 100 }}>
                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-10 w-10">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {permissions?.canDownload && (
                                    <DropdownMenuItem onClick={() => onDownload(currentPhoto)}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => setActiveDrawer('info')}>
                                    <Info className="h-4 w-4 mr-2" />
                                    Photo info
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
            {/* MIDDLE IMAGE AREA */}
            <div className="relative flex-1 overflow-hidden">
                <div className="embla h-full">
                    <div className="embla__viewport h-full" ref={emblaRef}>
                        <div className="embla__container h-full py-3">
                            {photos.map((photo, index) => (
                                <div
                                    key={index}
                                    className="embla__slide h-full px-3 md:px-0"
                                >
                                    {/* <img
                                        src={photo.url || photo.thumbnailUrl}
                                        alt={photo.originalName}
                                        draggable={false}
                                        className="rounded-md max-w-full max-h-full object-contain select-none "
                                        style={{
                                            transform: `scale(${zoom})`,
                                            // filter: 'drop-shadow(0 0 50px rgba(255,255,255,0.35))'
                                        }}
                                    /> */}
                                    <LazyLoadImage
                                        key={index}
                                        index={index}
                                        imgSrc={photo.url || photo.thumbnailUrl}
                                        inView={slidesInView.indexOf(index) > -1}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <button className="embla__prev absolute top-[50%] left-3 cursor-pointer hover:bg-gray-100/10 rounded-full p-2" onClick={scrollPrev}>
                        <CircleChevronLeft className="h-8 w-8 text-gray-400" />
                    </button>
                    <button className="embla__next absolute top-[50%] right-3 cursor-pointer hover:bg-gray-100/10 rounded-full p-2" onClick={scrollNext}>
                        <CircleChevronRight className="h-8 w-8 text-gray-400" />
                    </button>
                </div>
            </div>


            {/* Bottom Right Action Buttons */}
            {!activeDrawer && false && (
                <div className="absolute bottom-6 right-6 z-10 flex items-center gap-3">
                    {/* Like Button */}
                    {permissions?.canFavorite && (
                        <Button
                            variant="outline"
                            size="lg"
                            className="rounded-full shadow-lg transparent hover:scale-105 transition-transform"
                            onClick={async () => {
                                const isFavorited = photoFavorites[currentPhoto._id] || false;
                                await onFavoriteToggle(currentPhoto._id, !isFavorited);
                            }}
                        >
                            <Heart
                                className={`h-5 w-5 ${photoFavorites[currentPhoto._id] ? 'fill-current text-red-500' : ''}`}
                            />
                            {currentPhoto.favoritesCount > 0 && (
                                <span className="ml-2">{currentPhoto.favoritesCount}</span>
                            )}
                        </Button>
                    )}

                    {/* Say Something Button */}
                    {(permissions?.canFavorite || permissions?.canComment) && (
                        <Button
                            variant="secondary"
                            size="lg"
                            className="rounded-full shadow-lg hover:scale-105 transition-transform"
                            onClick={() => setActiveDrawer('activity')}
                        >
                            <MessageCircle className="h-5 w-5 mr-2" />
                            Say something
                        </Button>
                    )}
                </div>
            )}

            {/* Activity Drawer */}
            {activeDrawer === 'activity' && false && (
                <>
                    <div
                        className="absolute inset-0 bg-black/40 z-20 transition-opacity duration-300"
                        onClick={() => setActiveDrawer(null)}
                    />

                    <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white z-30 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                            <h2 className="text-lg font-semibold">Activity</h2>
                            <Button variant="ghost" size="icon" onClick={() => setActiveDrawer(null)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="p-6 space-y-6">
                            {permissions?.canFavorite && (
                                <div className="space-y-3">
                                    <PhotoFavoriteButton
                                        photoId={currentPhoto._id}
                                        initialIsFavorited={photoFavorites[currentPhoto._id] || false}
                                        initialCount={currentPhoto.favoritesCount || 0}
                                        onToggle={onFavoriteToggle}
                                        className="w-full"
                                    />
                                </div>
                            )}

                            {permissions?.canComment && (
                                <div className="space-y-3">
                                    <PhotoCommentSection
                                        photoId={currentPhoto._id}
                                        comments={photoComments[currentPhoto._id] || []}
                                        onAddComment={onAddComment}
                                        canComment={permissions?.canComment ?? false}
                                    />
                                </div>
                            )}

                            {(permissions?.canFavorite || permissions?.canComment) &&
                                !photoFavorites[currentPhoto._id] &&
                                (!photoComments[currentPhoto._id] || photoComments[currentPhoto._id].length === 0) && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-3">
                                            <Heart className="h-8 w-8 text-muted-foreground/50" />
                                        </div>
                                        <p className="text-sm font-medium">No activity</p>
                                        <p className="text-xs mt-1">Be the first to comment</p>
                                    </div>
                                )}
                        </div>
                    </div>
                </>
            )}

            {/* Info Drawer */}
            {activeDrawer === 'info' && (
                <>
                    <div
                        className="absolute inset-0 bg-black/40 z-20 transition-opacity duration-300"
                        onClick={() => setActiveDrawer(null)}
                    />

                    <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white z-30 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                            <h2 className="text-lg font-semibold">Info</h2>
                            <Button variant="ghost" size="icon" onClick={() => setActiveDrawer(null)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Filename</h3>
                                    <p className="text-sm break-all">{currentPhoto.originalName}</p>
                                </div>

                                {currentPhoto.width && currentPhoto.height && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Dimensions</h3>
                                        <p className="text-sm">{currentPhoto.width} × {currentPhoto.height}</p>
                                    </div>
                                )}

                                {currentPhoto.fileSize && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Size</h3>
                                        <p className="text-sm">{(currentPhoto.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                )}

                                {currentPhoto.createdAt && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Uploaded</h3>
                                        <p className="text-sm">{format(new Date(currentPhoto.createdAt), 'PPpp')}</p>
                                    </div>
                                )}

                                {currentPhoto.favoritesCount > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Favorites</h3>
                                        <p className="text-sm flex items-center gap-1">
                                            <Heart className="h-4 w-4 fill-current text-red-500" />
                                            {currentPhoto.favoritesCount} {currentPhoto.favoritesCount === 1 ? 'person' : 'people'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="border-t border-gray-600 shrink-0">
                <div className='h-[80px] w-full p-1' ref={emblaThumbsRef}>
                    <div
                        onWheel={(e) => {
                            e.currentTarget.scrollLeft += e.deltaY;
                        }}
                        className='flex h-full gap-2'>
                        {photos.length && photos.map((obj, index) => {
                            return (
                                <div>
                                    <img
                                        onClick={() => onThumbClick(index)}
                                        src={obj.thumbnailUrl || obj.url}
                                        alt={obj.originalName}
                                        className={`rounded-md h-full min-w-[100px] max-w-[100px] object-cover ${currentPhotoIndex === index ? 'border-2 border-primary' : ''}`}
                                    />
                                </div>
                            )
                        })}
                    </div>
                    {/* <div className="embla-thumbs">
                        <div className="embla-thumbs__viewport" ref={emblaThumbsRef}>
                            <div className="embla-thumbs__container gap-2">
                                {photos.length && photos.map((obj, index) => {
                                    return (
                                        <div onClick={() => onThumbClick(index)}>
                                            <img
                                                src={obj.thumbnailUrl || obj.url}
                                                alt={obj.originalName}
                                                className={`rounded-md h-full min-w-[100px] max-w-[100px] object-cover ${currentPhotoIndex === index ? 'border-2 border-primary' : ''}`}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    );
}
