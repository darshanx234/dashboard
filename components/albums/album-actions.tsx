'use client';

import { Button } from '@/components/ui/button';
import { Plus, Share2, Settings, Trash2 } from 'lucide-react';

interface AlbumActionsProps {
    onAddPhotos: () => void;
    onShare: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export function AlbumActions({
    onAddPhotos,
    onShare,
    onEdit,
    onDelete,
}: AlbumActionsProps) {
    return (
        <div className="flex gap-2">
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
    );
}
