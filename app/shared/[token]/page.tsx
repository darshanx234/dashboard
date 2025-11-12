'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import { shareApi, type Album, type Photo, type SharePermissions } from '@/lib/api/albums';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Dynamically import LightGallery to avoid SSR issues
import dynamic from 'next/dynamic';

const LightGallery = dynamic(() => import('lightgallery/react'), { ssr: false });

// Import lightgallery styles
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-thumbnail.css';
import 'lightgallery/css/lg-fullscreen.css';

// Import lightgallery plugins
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgZoom from 'lightgallery/plugins/zoom';
import lgFullscreen from 'lightgallery/plugins/fullscreen';

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
    const lightGalleryRef = useRef<any>(null);

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

    const onInit = useCallback(() => {
        console.log('LightGallery initialized');
    }, []);

    const onBeforeSlide = useCallback(() => {
        console.log('Before slide change');
    }, []);

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
            {/* Header */}
            <div className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col gap-3">
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
                </div>
            </div>

            {/* Photos Masonry Gallery with LightGallery */}
            <div className="container mx-auto px-4 py-6 md:py-8">
                {photos.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
                            <p className="text-sm text-muted-foreground">
                                Photos will appear here once they are uploaded
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <LightGallery
                        onInit={onInit}
                        onBeforeSlide={onBeforeSlide}
                        speed={500}
                        plugins={[lgThumbnail, lgZoom, lgFullscreen]}
                        mode="lg-fade"
                        thumbnail={true}
                        download={permissions?.canDownload}
                        elementClassNames="masonry-gallery"
                        mobileSettings={{
                            controls: true,
                            showCloseIcon: true,
                            download: permissions?.canDownload,
                        }}
                    >
                        {photos.map((photo) => (
                            <a
                                key={photo._id}
                                href={photo.url || photo.thumbnailUrl || ''}
                                data-lg-size={photo.width && photo.height ? `${photo.width}-${photo.height}` : undefined}
                                className="block break-inside-avoid mb-3"
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
                            </a>
                        ))}
                    </LightGallery>
                )}
            </div>
        </div>
    );
}
