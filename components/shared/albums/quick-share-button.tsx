'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { ShareDialog } from './share-dialog';

interface QuickShareButtonProps {
  albumId: string;
  albumTitle: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function QuickShareButton({ albumId, albumTitle, variant = 'ghost', size = 'sm' }: QuickShareButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Share2 className="h-4 w-4" />
      </Button>
      <ShareDialog
        open={open}
        onOpenChange={setOpen}
        albumId={albumId}
        albumTitle={albumTitle}
      />
    </>
  );
}
