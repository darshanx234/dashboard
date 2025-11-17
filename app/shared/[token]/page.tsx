'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Download,
    Heart,
    Loader2,
    Lock,
    Calendar,
    MapPin,
    Image as ImageIcon,
    AlertCircle,
    ArrowLeft,
    X,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    Eye,
} from 'lucide-react';
import { shareApi, type Album, type Photo, type SharePermissions } from '@/lib/api/albums';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Link from 'next/link';

export default function SharedAlbumPage() {
    const params = useParams();
    const { toast } = useToast();
    const token = params.token as string;

    const [loading, setLoading] = useState(true);
    const [requiresPassword, setRequiresPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);
    const [album, setAlbum] = useState<Album | null>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [permissions, setPermissions] = useState<SharePermissions | null>(null);
    const [shareType, setShareType] = useState<string>('');
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState({
        isOpen: false,
        currentIndex: 0,
        zoom: 1,
    });

    useEffect(() => {
        loadSharedAlbum();
    }, [token]);

    const loadSharedAlbum = async () => {
        try {
            setLoading(true);
            const response = await shareApi.accessSharedAlbum(token);

            // Check if password is required
            // if (response.requiresPassword) {
            //     setRequiresPassword(true);
            //     setLoading(false);
            //     return;
            // }

            // Successfully loaded album
            setAlbum(response.album);
            setPhotos(response.photos);
            setPermissions(response.permissions);
            setShareType(response.shareType);
            setExpiresAt(response.expiresAt || null);
            setVerified(true);
            setRequiresPassword(false);
            
        } catch (error: any) {
            console.error('Load shared album error:', error);
            
            // Check if it's a password required error
            if (error.message.includes('Password verification required') || 
                error.message.includes('Access token expired')) {
                setRequiresPassword(true);
                setVerified(false);
            } else {
                toast({
                    title: 'Error',
                    description: error.message || 'Failed to load album',
                    variant: 'destructive',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password) {
            toast({
                title: 'Error',
                description: 'Please enter a password',
                variant: 'destructive',
            });
            return;
        }

        try {
            setVerifying(true);
            
            // Verify password - this will set a cookie with access token
            await shareApi.verifySharePassword(token, password);
            
            // Password verified, now load the album with the access token
            toast({
                title: 'Success',
                description: 'Password verified successfully',
            });
            
            // Reload the album - this time with the access token cookie
            await loadSharedAlbum();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Invalid password',
                variant: 'destructive',
            });
        } finally {
            setVerifying(false);
        }
    };

    const handleDownload = async (photo: Photo) => {
        if (!permissions?.canDownload) {
            toast({
                title: 'Not Allowed',
                description: 'Download permission is not enabled for this album',
                variant: 'destructive',
            });
            return;
        }

        try {
            const link = document.createElement('a');
            link.href = photo.url || '';
            link.download = photo.originalName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: 'Success',
                description: 'Photo download started',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to download photo',
                variant: 'destructive',
            });
        }
    };

    // Image Preview Functions
    const openImagePreview = (index: number) => {
        setImagePreview({ isOpen: true, currentIndex: index, zoom: 1 });
        document.body.style.overflow = 'hidden';
    };

    const closeImagePreview = () => {
        setImagePreview({ isOpen: false, currentIndex: 0, zoom: 1 });
        document.body.style.overflow = 'unset';
    };

    const goToNextImage = () => {
        setImagePreview(prev => ({
            ...prev,
            currentIndex: (prev.currentIndex + 1) % photos.length,
            zoom: 1,
        }));
    };

    const goToPrevImage = () => {
        setImagePreview(prev => ({
            ...prev,
            currentIndex: prev.currentIndex === 0 ? photos.length - 1 : prev.currentIndex - 1,
            zoom: 1,
        }));
    };

    const handleZoomIn = () => {
        setImagePreview(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.5, 3) }));
    };

    const handleZoomOut = () => {
        setImagePreview(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.5, 0.5) }));
    };

    const handleResetZoom = () => {
        setImagePreview(prev => ({ ...prev, zoom: 1 }));
    };

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!imagePreview.isOpen) return;

            switch (e.key) {
                case 'Escape':
                    closeImagePreview();
                    break;
                case 'ArrowLeft':
                    goToPrevImage();
                    break;
                case 'ArrowRight':
                    goToNextImage();
                    break;
                case '+':
                case '=':
                    handleZoomIn();
                    break;
                case '-':
                case '_':
                    handleZoomOut();
                    break;
                case '0':
                    handleResetZoom();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [imagePreview.isOpen, photos.length]);

    // Password required view
    if (requiresPassword && !verified) {
        console.log("still here")
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                                <Lock className="h-8 w-8 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold mb-2">Password Protected</h1>
                            <p className="text-muted-foreground">
                                This album is protected. Please enter the password to view.
                            </p>
                        </div>

                        <form onSubmit={handlePasswordVerify} className="space-y-4">
                            <Input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={verifying}
                            />
                            <Button type="submit" className="w-full" disabled={verifying}>
                                {verifying ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Access Album'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading album...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (!album) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Album Not Found</h2>
                        <p className="text-muted-foreground">
                            This album may have been removed or the link has expired.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Main album view
    return (
        <div className="min-h-screen bg-background">
            <div className="space-y-6 container mx-auto px-4 py-6">
                {/* Header - Not Fixed */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold">{album.title}</h1>
                            {album.description && (
                                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                                    {album.description}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2 ml-4">
                            {shareType === 'link' && (
                                <Badge variant="secondary">Public Link</Badge>
                            )}
                            {shareType === 'email' && (
                                <Badge variant="secondary">Private Share</Badge>
                            )}
                        </div>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                            <span className="font-medium text-foreground">{album.totalPhotos}</span>
                            <span>photos</span>
                        </div>
                        {album.shootDate && (
                            <>
                                <span className="text-muted-foreground">•</span>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>{format(new Date(album.shootDate), 'MMM d, yyyy')}</span>
                                </div>
                            </>
                        )}
                        {album.location && (
                            <>
                                <span className="text-muted-foreground">•</span>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>{album.location}</span>
                                </div>
                            </>
                        )}
                        {expiresAt && (
                            <>
                                <span className="text-muted-foreground">•</span>
                                <div className="flex items-center gap-1.5 text-orange-500">
                                    <Calendar className="h-4 w-4" />
                                    <span>Expires {format(new Date(expiresAt), 'MMM d, yyyy')}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Photographer & Permissions */}
                    <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                        {album.photographerName && (
                            <span className="text-muted-foreground">
                                By <span className="text-foreground font-medium">{album.photographerName}</span>
                            </span>
                        )}
                        {permissions?.canDownload && (
                            <>
                                {album.photographerName && <span className="text-muted-foreground">•</span>}
                                <Badge variant="outline" className="text-xs">
                                    <Download className="h-3 w-3 mr-1" />
                                    Downloads Enabled
                                </Badge>
                            </>
                        )}
                        {permissions?.canFavorite && (
                            <Badge variant="outline" className="text-xs">
                                <Heart className="h-3 w-3 mr-1" />
                                Can Favorite
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Photos Masonry Gallery */}
                <div>
                    {photos.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
                                <p className="text-sm text-muted-foreground text-center max-w-md">
                                    Photos will appear here once they are uploaded
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
                            {photos.map((photo, index) => (
                                <div
                                    key={photo._id}
                                    className="break-inside-avoid mb-4"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openImagePreview(index);
                                    }}
                                >
                                    <div className="group relative overflow-hidden rounded-lg bg-muted hover:shadow-xl transition-all duration-300 cursor-pointer">
                                        {photo.url || photo.thumbnailUrl ? (
                                            <img
                                                src={photo.thumbnailUrl || photo.url}
                                                alt={photo.originalName}
                                                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                                                loading="lazy"
                                            />
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
                                                {photo.width && photo.height && (
                                                    <p className="text-xs text-white/70 mt-0.5">
                                                        {photo.width} × {photo.height}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Download Button */}
                                            {permissions?.canDownload && (
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        className="h-8 w-8 p-0"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleDownload(photo);
                                                        }}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Favorite Badge */}
                                        {photo.favoritesCount > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm"
                                            >
                                                <Heart className="h-3 w-3 mr-1 fill-current text-red-500" />
                                                {photo.favoritesCount}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Image Preview Modal */}
                {imagePreview.isOpen && photos.length > 0 && (
                    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
                        style={{ margin: 0 }}>
                        {/* Close Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 z-10 text-white hover:bg-white/10 h-10 w-10"
                            onClick={closeImagePreview}
                        >
                            <X className="h-6 w-6" />
                        </Button>

                        {/* Image Counter */}
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                            <span className="text-white text-sm font-medium">
                                {imagePreview.currentIndex + 1} / {photos.length}
                            </span>
                        </div>

                        {/* Navigation Buttons */}
                        {photos.length > 1 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/10 h-12 w-12"
                                    onClick={goToPrevImage}
                                >
                                    <ChevronLeft className="h-8 w-8" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/10 h-12 w-12"
                                    onClick={goToNextImage}
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
                                onClick={handleZoomOut}
                                disabled={imagePreview.zoom <= 0.5}
                            >
                                <ZoomOut className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-white/10 px-3"
                                onClick={handleResetZoom}
                            >
                                {Math.round(imagePreview.zoom * 100)}%
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/10 h-10 w-10"
                                onClick={handleZoomIn}
                                disabled={imagePreview.zoom >= 3}
                            >
                                <ZoomIn className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Image Info and Actions */}
                        <div className="absolute bottom-4 left-4 z-10 max-w-md">
                            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
                                <h3 className="font-semibold text-sm mb-2">{photos[imagePreview.currentIndex]?.originalName}</h3>
                                <div className="flex items-center gap-4 text-xs text-white/80">
                                    {photos[imagePreview.currentIndex]?.favoritesCount > 0 && (
                                        <span className="flex items-center gap-1">
                                            <Heart className="h-3 w-3 fill-current text-red-500" />
                                            {photos[imagePreview.currentIndex]?.favoritesCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-3">
                                    {permissions?.canDownload && (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => handleDownload(photos[imagePreview.currentIndex])}
                                        >
                                            <Download className="h-3 w-3 mr-1.5" />
                                            Download
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Main Image Container */}
                        <div className="relative w-full h-full flex items-center justify-center p-20 overflow-auto">
                            <img
                                src={photos[imagePreview.currentIndex]?.url || photos[imagePreview.currentIndex]?.thumbnailUrl}
                                alt={photos[imagePreview.currentIndex]?.originalName}
                                className="max-w-full max-h-full object-contain transition-transform duration-200"
                                style={{
                                    transform: `scale(${imagePreview.zoom})`,
                                    cursor: imagePreview.zoom > 1 ? 'grab' : 'default'
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
                )}
            </div>
        </div>
    );
}
