'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoFavoriteButtonProps {
    photoId: string;
    initialIsFavorited: boolean;
    initialCount: number;
    onToggle: (photoId: string, isFavorite: boolean) => Promise<void>;
    className?: string;
}

export function PhotoFavoriteButton({
    photoId,
    initialIsFavorited,
    initialCount,
    onToggle,
    className,
}: PhotoFavoriteButtonProps) {
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
    const [count, setCount] = useState(initialCount);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isLoading) return;

        // Optimistic update
        const newIsFavorited = !isFavorited;
        const newCount = newIsFavorited ? count + 1 : Math.max(0, count - 1);

        setIsFavorited(newIsFavorited);
        setCount(newCount);
        setIsLoading(true);

        try {
            await onToggle(photoId, newIsFavorited);
        } catch (error) {
            // Revert on error
            setIsFavorited(!newIsFavorited);
            setCount(count);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            size="sm"
            variant={isFavorited ? 'default' : 'secondary'}
            className={cn('gap-1.5', className)}
            onClick={handleToggle}
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Heart
                    className={cn(
                        'h-4 w-4 transition-all',
                        isFavorited && 'fill-current'
                    )}
                />
            )}
            <span className="text-sm font-medium">{count}</span>
        </Button>
    );
}
