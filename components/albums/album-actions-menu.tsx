'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Share2, Trash2, Eye } from 'lucide-react';
import { EditAlbumDialog } from './edit-album-dialog';
import { ShareDialog } from './share-dialog';
import { albumApi, type Album } from '@/lib/api/albums';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AlbumActionsMenuProps {
  album: Album;
  onAlbumUpdated?: (album: Album) => void;
  onAlbumDeleted?: (albumId: string) => void;
}

export function AlbumActionsMenu({ album, onAlbumUpdated, onAlbumDeleted }: AlbumActionsMenuProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const handleView = (e: Event) => {
    e.preventDefault();
    router.push(`/albums/${album._id}`);
  };

  const handleDelete = async (e: Event) => {
    e.preventDefault();
    
    if (!confirm('Are you sure you want to delete this album? This will delete all photos.')) {
      return;
    }

    try {
      await albumApi.deleteAlbum(album._id);
      toast({
        title: 'Success',
        description: 'Album deleted successfully',
      });
      onAlbumDeleted?.(album._id);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete album',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={handleView}>
            <Eye className="h-4 w-4 mr-2" />
            View Album
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setEditOpen(true);
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setShareOpen(true);
            }}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditAlbumDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        album={album}
        onAlbumUpdated={(updatedAlbum) => {
          onAlbumUpdated?.(updatedAlbum);
        }}
      />

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        albumId={album._id}
        albumTitle={album.title}
      />
    </>
  );
}
