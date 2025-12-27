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
} from 'lucide-react';
import { shareApi, type Album, type Photo, type SharePermissions } from '@/lib/api/albums';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Link from 'next/link';
import { ClientIdentityDialog } from '@/components/shared/ClientIdentityDialog';
import { PhotoGallery } from '@/components/shared/albums/photo-gallery';

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


    // Client identity state
    const [showIdentityDialog, setShowIdentityDialog] = useState(false);
    const [isIdentitySubmitting, setIsIdentitySubmitting] = useState(false);
    const [clientId, setClientId] = useState<string | null>(null);
    const [clientIdentifier, setClientIdentifier] = useState<string>('');

    // Photo interactions state
    const [photoFavorites, setPhotoFavorites] = useState<Record<string, boolean>>({});
    const [photoComments, setPhotoComments] = useState<Record<string, any[]>>({});

    useEffect(() => {
        // Generate or retrieve client identifier
        let identifier = localStorage.getItem(`client_identifier_${token}`);
        if (!identifier) {
            // Generate unique identifier for this client
            identifier = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(`client_identifier_${token}`, identifier);
        }
        setClientIdentifier(identifier);

        // Check if client identity exists in localStorage
        const storedClientId = localStorage.getItem(`client_${token}`);
        if (storedClientId) {
            setClientId(storedClientId);
            loadSharedAlbum();
        } else {
            // Show identity dialog first
            setShowIdentityDialog(true);
            setLoading(false);
        }
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

    // Handle client identity submission
    const handleIdentitySubmit = async (name: string, email?: string) => {
        setIsIdentitySubmitting(true);
        try {
            const response = await shareApi.saveClientIdentity(token, name, email, clientIdentifier);
            setClientId(response.clientId);
            localStorage.setItem(`client_${token}`, response.clientId);
            setShowIdentityDialog(false);

            const welcomeMessage = response.isReturningClient
                ? 'Welcome back!'
                : 'Welcome!';

            toast({
                title: welcomeMessage,
                description: 'Loading album...',
            });

            // Now load the album
            await loadSharedAlbum();

            // Track album_open interaction
            await shareApi.trackInteraction(token, 'album_open', {
                clientId: response.clientId,
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to save your information',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setIsIdentitySubmitting(false);
        }
    };

    // Handle favorite toggle
    const handleFavoriteToggle = async (photoId: string, isFavorite: boolean) => {
        if (!permissions?.canFavorite) {
            toast({
                title: 'Not Allowed',
                description: 'Favorites are not enabled for this album',
                variant: 'destructive',
            });
            return;
        }

        try {
            const response = await shareApi.toggleFavorite(token, photoId, isFavorite, clientId || undefined);

            // Always update photoFavorites so button shows correct state
            setPhotoFavorites(prev => ({ ...prev, [photoId]: isFavorite }));
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update favorite',
                variant: 'destructive',
            });
            throw error;
        }
    };

    // Handle add comment
    const handleAddComment = async (photoId: string, comment: string) => {
        if (!permissions?.canComment) {
            toast({
                title: 'Not Allowed',
                description: 'Comments are not enabled for this album',
                variant: 'destructive',
            });
            return;
        }

        try {
            const response = await shareApi.addComment(token, photoId, comment, clientId || undefined);

            // Update local comments
            setPhotoComments(prev => ({
                ...prev,
                [photoId]: [response.comment, ...(prev[photoId] || [])],
            }));

            toast({
                title: 'Success',
                description: 'Comment added',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to add comment',
                variant: 'destructive',
            });
            throw error;
        }
    };

    // Handle selection toggle
    const handleSelectionToggle = async (photoId: string, isClientSelected: boolean) => {
        try {
            await shareApi.toggleSelection(token, photoId, isClientSelected);

            // Update local state
            setPhotos(prevPhotos =>
                prevPhotos.map(p =>
                    p._id === photoId
                        ? { ...p, isClientSelected }
                        : p
                )
            );

            toast({
                title: isClientSelected ? 'Selected' : 'Deselected',
                description: isClientSelected ? 'Photo marked as selected' : 'Photo removed from selection',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update selection',
                variant: 'destructive',
            });
            throw error;
        }
    };

    // Track photo view
    const handlePhotoView = async (photoId: string) => {
        if (!clientId) return;

        try {
            await shareApi.trackInteraction(token, 'photo_view', {
                clientId,
                photoId,
            });
        } catch (error) {
            // Silently fail for tracking
            console.error('Failed to track photo view:', error);
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

    // Show identity dialog first if client hasn't identified themselves
    if (showIdentityDialog && !clientId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <ClientIdentityDialog
                    open={showIdentityDialog}
                    onSubmit={handleIdentitySubmit}
                    isSubmitting={isIdentitySubmitting}
                />
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
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Album Header */}
                <div className="mb-8">
                    {/* Title and Share Type */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                                {album.title}
                            </h1>
                            {album.description && (
                                <p className="text-muted-foreground text-base md:text-lg max-w-3xl">
                                    {album.description}
                                </p>
                            )}
                        </div>
                        {(shareType === 'link' || shareType === 'email') && (
                            <Badge variant="secondary" className="ml-4 shrink-0">
                                {shareType === 'link' ? 'Public Link' : 'Private Share'}
                            </Badge>
                        )}
                    </div>

                    {/* Metadata Card */}
                    <Card className="border-none shadow-sm bg-muted/30">
                        <CardContent className="p-4">
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                {/* Photo Count */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                                        <ImageIcon className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">{album.totalPhotos}</p>
                                        <p className="text-xs text-muted-foreground">Photos</p>
                                    </div>
                                </div>

                                {/* Divider */}
                                {(album.shootDate || album.location) && (
                                    <div className="h-8 w-px bg-border" />
                                )}

                                {/* Shoot Date */}
                                {album.shootDate && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10">
                                            <Calendar className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">
                                                {format(new Date(album.shootDate), 'MMM d, yyyy')}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Shoot Date</p>
                                        </div>
                                    </div>
                                )}

                                {/* Location */}
                                {album.location && (
                                    <>
                                        {album.shootDate && <div className="h-8 w-px bg-border" />}
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10">
                                                <MapPin className="h-4 w-4 text-green-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{album.location}</p>
                                                <p className="text-xs text-muted-foreground">Location</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Expiration Warning */}
                                {expiresAt && (
                                    <>
                                        <div className="h-8 w-px bg-border" />
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10">
                                                <Calendar className="h-4 w-4 text-orange-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-orange-600">
                                                    {format(new Date(expiresAt), 'MMM d, yyyy')}
                                                </p>
                                                <p className="text-xs text-orange-500">Expires</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Photos Masonry Gallery */}
                <div>
                    <PhotoGallery
                        photos={photos}
                        selectedPhotos={new Set()}
                        onPhotoSelect={(photoId) => handleSelectionToggle(photoId, !photos.find(p => p._id === photoId)?.isClientSelected)}
                        hasSelection={true}
                        canDownload={permissions?.canDownload}
                        onDownload={handleDownload}
                        useInternalPreview={true}
                        permissions={permissions}
                        clientId={clientId}
                        token={token}
                        photoFavorites={photoFavorites}
                        photoComments={photoComments}
                        onFavoriteToggle={handleFavoriteToggle}
                        onAddComment={handleAddComment}
                        onSelectionToggle={handleSelectionToggle}
                    />
                </div>


            </div>
        </div>
    );
}
