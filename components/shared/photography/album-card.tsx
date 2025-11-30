'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Album } from '@/types/photography';
import { MoreHorizontal, Lock, Share2, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AlbumCardProps {
  album: Album;
  onEdit?: (album: Album) => void;
  onShare?: (album: Album) => void;
  onDelete?: (albumId: string) => void;
}

const privacyIcons = {
  private: <Lock className="h-4 w-4" />,
  password_protected: <Lock className="h-4 w-4" />,
  public: <Share2 className="h-4 w-4" />,
};

const privacyLabels = {
  private: 'Private',
  password_protected: 'Password Protected',
  public: 'Public',
};

export function AlbumCard({ album, onEdit, onShare, onDelete }: AlbumCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 relative group">
        {album.cover_photo_id ? (
          <img
            src={`/api/photos/${album.cover_photo_id}/thumbnail`}
            alt={album.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-slate-400">No photos yet</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Link href={`/photographer/albums/${album.id}`}>
            <Button size="sm" variant="secondary">
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate">{album.title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {album.description || 'No description'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onShare?.(album)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(album)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(album.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {privacyIcons[album.privacy_setting]}
            <span>{privacyLabels[album.privacy_setting]}</span>
          </div>
          <span>{album.photo_count || 0} photos</span>
        </div>
      </CardContent>
    </Card>
  );
}
