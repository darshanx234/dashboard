'use client';

import { Button } from '@/components/ui/button';
import { Check, X, Trash2 } from 'lucide-react';

interface SelectionHeaderProps {
    selectedCount: number;
    totalCount: number;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onDelete: () => void;
}

export function SelectionHeader({
    selectedCount,
    totalCount,
    onSelectAll,
    onDeselectAll,
    onDelete,
}: SelectionHeaderProps) {
    return (
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4 border">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">
                            {selectedCount} Photo{selectedCount > 1 ? 's' : ''} Selected
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {selectedCount === totalCount
                                ? 'All photos selected'
                                : `${totalCount - selectedCount} remaining`}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {selectedCount < totalCount && (
                    <Button variant="outline" size="sm" onClick={onSelectAll}>
                        <Check className="h-4 w-4 mr-2" />
                        Select All
                    </Button>
                )}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onDeselectAll}
                    title="Deselect all"
                >
                    <X className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                    variant="destructive"
                    size="icon"
                    onClick={onDelete}
                    title="Delete selected photos"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
