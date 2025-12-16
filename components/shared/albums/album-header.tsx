'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, Download, Heart, Image as ImageIcon, Plus, Share2, Settings, Trash2, MoreVertical } from 'lucide-react';
import type { Album, Photo } from '@/lib/api/albums';

interface AlbumHeaderProps {
    album: Album;
    photos: Photo[];
    onAddPhotos: () => void;
    onShare: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export function AlbumHeader({ album, photos, onAddPhotos, onShare, onEdit, onDelete }: AlbumHeaderProps) {
    return (
        <div className="flex-1">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{album.title}</h1>
                    {album.description && (
                        <p className="text-muted-foreground mt-2 max-w-2xl">{album.description}</p>
                    )}
                </div>
                <div className="md:hidden">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onAddPhotos}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Photos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onShare}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onEdit}>
                                <Settings className="h-4 w-4 mr-2" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {/* <Badge
                    variant={album.status === 'published' ? 'default' : 'secondary'}
                    className="ml-4"
                >
                    {album.status}
                </Badge> */}

            </div>
            {/* Metadata Row */}
            <div className="items-center gap-4 mt-3 text-sm hidden md:flex">
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

            <div className="gap-2 mt-3 hidden md:flex">
                <Button onClick={onAddPhotos}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Photos
                </Button>
                <Button variant="outline" onClick={onShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                </Button>
                <Button variant="outline" onClick={onEdit}>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit
                </Button>
                <Button variant="outline" onClick={onDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                </Button>
            </div>

        </div >
    );
}

