'use client';

import { Badge } from '@/components/ui/badge';
import { Eye, Download, Heart, Image as ImageIcon } from 'lucide-react';
import type { Album, Photo } from '@/lib/api/albums';

interface AlbumHeaderProps {
    album: Album;
    photos: Photo[];
}

export function AlbumHeader({ album, photos }: AlbumHeaderProps) {
    return (
        <div className="flex-1">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{album.title}</h1>
                    {album.description && (
                        <p className="text-muted-foreground mt-2 max-w-2xl">{album.description}</p>
                    )}
                </div>
                <Badge
                    variant={album.status === 'published' ? 'default' : 'secondary'}
                    className="ml-4"
                >
                    {album.status}
                </Badge>
            </div>

            {/* Metadata Row */}
            <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    <span className="font-medium text-foreground">{album.totalPhotos}</span>
                    <span>photos</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span className="font-medium text-foreground">{album.totalViews}</span>
                    <span>views</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Download className="h-4 w-4" />
                    <span className="font-medium text-foreground">{album.totalDownloads}</span>
                    <span>downloads</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span className="font-medium text-foreground">
                        {photos.filter((p) => p.favoritesCount > 0).length}
                    </span>
                    <span>favorites</span>
                </div>
                {album.shootDate && (
                    <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                            {new Date(album.shootDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </span>
                    </>
                )}
                {album.location && (
                    <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">📍 {album.location}</span>
                    </>
                )}
            </div>
        </div>
    );
}
