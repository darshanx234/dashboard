'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { albumApi, photoApi, type Album, type Photo } from '@/lib/api/albums';
import { useToast } from '@/hooks/use-toast';
import { ShareDialog } from '@/components/albums/share-dialog';
import { EditAlbumDialog } from '@/components/albums/edit-album-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Extracted Components
import { UploadDropZone } from '@/components/albums/upload-drop-zone';
import { UploadProgressPanel, type UploadingFile } from '@/components/albums/upload-progress-panel';
import { PhotoGallery } from '@/components/albums/photo-gallery';
import { ImagePreviewModal } from '@/components/albums/image-preview-modal';
import { AlbumHeader } from '@/components/albums/album-header';
import { AlbumActions } from '@/components/albums/album-actions';
import { SelectionHeader } from '@/components/albums/selection-header';

// Upload Service
import { UploadService, type UploadTask } from '@/lib/services/upload-service';

export default function AlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadServiceRef = useRef<UploadService | null>(null);

  // State
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadPanelExpanded, setUploadPanelExpanded] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imagePreview, setImagePreview] = useState({
    isOpen: false,
    currentIndex: 0,
    zoom: 1,
  });

  const albumId = params.id as string;

  // Initialize upload serv ice
  useEffect(() => {
    uploadServiceRef.current = new UploadService({
      onProgress: (taskId, progress) => {
        setUploadingFiles((prev) =>
          prev.map((file) =>
            file.id === taskId ? { ...file, progress } : file
          )
        );
      },
      onSuccess: (taskId, photo) => {
        setUploadingFiles((prev) =>
          prev.map((file) =>
            file.id === taskId
              ? { ...file, status: 'success', progress: 100, photo }
              : file
          )
        );

        // Add photo to gallery
        setPhotos((prev) => [...prev, photo]);

        // Update album count
        setAlbum((prev) => prev ? { ...prev, totalPhotos: prev.totalPhotos + 1 } : null);
      },
      onError: (taskId, error) => {
        setUploadingFiles((prev) =>
          prev.map((file) =>
            file.id === taskId
              ? { ...file, status: 'error', error }
              : file
          )
        );

        toast({
          title: 'Upload failed',
          description: error,
          variant: 'destructive',
        });
      },
      onStatusChange: (taskId, status) => {
        setUploadingFiles((prev) =>
          prev.map((file) =>
            file.id === taskId
              ? { ...file, status: status as UploadingFile['status'] }
              : file
          )
        );
      },
      onComplete: () => {
        setIsUploading(false);

        // Get success count from upload service queue status
        setUploadingFiles((prev) => {
          const successCount = prev.filter((f) => f.status === 'success').length;
          if (successCount > 0) {
            toast({
              title: 'Upload complete',
              description: `Successfully uploaded ${successCount} photo${successCount > 1 ? 's' : ''}`,
            });
          }
          return prev;
        });
      },
    });

    return () => {
      uploadServiceRef.current?.destroy();
    };
  }, []); // Remove album dependency to prevent recreation during uploads

  // Fetch album and photos
  useEffect(() => {
    fetchAlbumData();
  }, [albumId]);

  const fetchAlbumData = async () => {
    try {
      setLoading(true);
      const [albumResponse, photosResponse] = await Promise.all([
        albumApi.getAlbum(albumId),
        photoApi.getPhotos(albumId, { limit: 100 }),
      ]);

      setAlbum(albumResponse.album);
      setPhotos(photosResponse.photos);
    } finally {
      setLoading(false);
    }
  };

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    processFiles(files);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const processFiles = (files: File[]) => {
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file',
          description: `${file.name} is not an image file`,
          variant: 'destructive',
        });
        return false;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 50MB limit`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setUploadPanelExpanded(true);
      uploadFiles(validFiles);
    }
  };

  const uploadFiles = (files: File[]) => {
    if (!uploadServiceRef.current) return;

    setIsUploading(true);

    // Add files to upload service queue
    const taskIds = uploadServiceRef.current.addToQueue(files, albumId);

    // Create uploading file entries
    const newUploadingFiles: UploadingFile[] = files.map((file, index) => ({
      id: taskIds[index],
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    // Start uploads
    uploadServiceRef.current.startUploads();
  };

  const handleCancelUpload = () => {
    if (!uploadServiceRef.current) return;

    if (confirm('Are you sure you want to cancel all uploads?')) {
      uploadServiceRef.current.cancelAll();
      setUploadingFiles([]);
      setIsUploading(false);
      toast({
        title: 'Cancelled',
        description: 'Upload cancelled',
      });
    }
  };

  const clearUploadingFiles = () => {
    setUploadingFiles([]);
  };

  // Album actions
  const handleAlbumUpdated = (updatedAlbum: Album) => {
    setAlbum(updatedAlbum);
  };

  const handleDeleteAlbum = async () => {
    if (!confirm('Are you sure you want to delete this album? This will delete all photos.')) {
      return;
    }

    try {
      await albumApi.deleteAlbum(albumId);
      toast({
        title: 'Success',
        description: 'Album deleted successfully',
      });
      router.push('/albums');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete album',
        variant: 'destructive',
      });
    }
  };

  // Photo selection
  const togglePhotoSelection = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const selectAllPhotos = () => {
    setSelectedPhotos(new Set(photos.map((p) => p._id)));
  };

  const deselectAllPhotos = () => {
    setSelectedPhotos(new Set());
  };

  const handleDeleteSelectedPhotos = async () => {
    try {
      setIsDeleting(true);
      const photoIds = Array.from(selectedPhotos);

      const data = await photoApi.deletePhotos(albumId, photoIds);

      toast({
        title: 'Success',
        description: data.message,
      });

      if (imagePreview.isOpen) {
        closeImagePreview();
      }

      await fetchAlbumData();

      setSelectedPhotos(new Set());
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete photos',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Image preview
  const openImagePreview = (index: number) => {
    setImagePreview({ isOpen: true, currentIndex: index, zoom: 1 });
  };

  const closeImagePreview = () => {
    setImagePreview({ isOpen: false, currentIndex: 0, zoom: 1 });
  };

  const goToNextImage = () => {
    setImagePreview((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % photos.length,
      zoom: 1,
    }));
  };

  const goToPrevImage = () => {
    setImagePreview((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? photos.length - 1 : prev.currentIndex - 1,
      zoom: 1,
    }));
  };

  const handleZoomIn = () => {
    setImagePreview((prev) => ({ ...prev, zoom: Math.min(prev.zoom + 0.5, 3) }));
  };

  const handleZoomOut = () => {
    setImagePreview((prev) => ({ ...prev, zoom: Math.max(prev.zoom - 0.5, 0.5) }));
  };

  const handleResetZoom = () => {
    setImagePreview((prev) => ({ ...prev, zoom: 1 }));
  };

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  // Not found state
  if (!album) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Album not found</h2>
          <p className="text-muted-foreground mt-2">This album may have been deleted</p>
          <Button className="mt-4" asChild>
            <Link href="/albums">Back to Albums</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div
        className="space-y-6"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Upload Drop Zone */}
        <UploadDropZone
          albumTitle={album.title}
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
        />

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/albums"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Albums
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4">
          {selectedPhotos.size > 0 ? (
            <SelectionHeader
              selectedCount={selectedPhotos.size}
              totalCount={photos.length}
              onSelectAll={selectAllPhotos}
              onDeselectAll={deselectAllPhotos}
              onDelete={() => setDeleteDialogOpen(true)}
            />
          ) : (
            <>
              <div className="flex items-start justify-between">
                <AlbumHeader album={album} photos={photos} />
              </div>
              <AlbumActions
                onAddPhotos={() => fileInputRef.current?.click()}
                onShare={() => setShareDialogOpen(true)}
                onEdit={() => setEditDialogOpen(true)}
                onDelete={handleDeleteAlbum}
              />
            </>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {selectedPhotos.size} photo{selectedPhotos.size > 1 ? 's' : ''}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the selected photo
                {selectedPhotos.size > 1 ? 's' : ''} from the album and remove{' '}
                {selectedPhotos.size > 1 ? 'them' : 'it'} from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={isDeleting}
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSelectedPhotos}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Album Dialog */}
        {album && (
          <EditAlbumDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            album={album}
            onAlbumUpdated={handleAlbumUpdated}
          />
        )}

        {/* Share Dialog */}
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          albumId={albumId}
          albumTitle={album.title}
        />

        {/* Upload Progress Panel */}
        <UploadProgressPanel
          uploadingFiles={uploadingFiles}
          isUploading={isUploading}
          isExpanded={uploadPanelExpanded}
          onToggleExpand={setUploadPanelExpanded}
          onCancel={handleCancelUpload}
          onClear={clearUploadingFiles}
          onAddMore={() => fileInputRef.current?.click()}
        />

        {/* Photo Gallery */}
        <PhotoGallery
          photos={photos}
          selectedPhotos={selectedPhotos}
          hasSelection={selectedPhotos.size > 0}
          onPhotoClick={openImagePreview}
          onPhotoSelect={togglePhotoSelection}
        />

        {/* Image Preview Modal */}
        <ImagePreviewModal
          photos={photos}
          currentIndex={imagePreview.currentIndex}
          zoom={imagePreview.zoom}
          isOpen={imagePreview.isOpen}
          onClose={closeImagePreview}
          onNext={goToNextImage}
          onPrev={goToPrevImage}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
        />
      </div>
    </AppLayout>
  );
}
