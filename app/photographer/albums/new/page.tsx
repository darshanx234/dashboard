'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { AlbumForm } from '@/components/photography/album-form';
import { PhotoUploader } from '@/components/photography/photo-uploader';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewAlbumPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAlbum = async (data: any) => {
    setIsLoading(true);
    try {
      console.log('Creating album with data:', data);
      router.push('/photographer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (files: File[]) => {
    console.log('Uploading files:', files);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <Link href="/photographer">
          <Button variant="ghost" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Albums
          </Button>
        </Link>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Album</h1>
          <p className="text-muted-foreground mt-2">
            Add album details and upload your photos
          </p>
        </div>

        <AlbumForm onSubmit={handleCreateAlbum} isLoading={isLoading} />

        <PhotoUploader onUpload={handleUpload} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
}
