'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import { albumApi, photoApi, type Album, type Photo } from '@/lib/api/albums';
import { useToast } from '@/hooks/use-toast';
import { ShareDialog } from '@/components/shared/albums/share-dialog';
import { EditAlbumDialog } from '@/components/shared/albums/edit-album-dialog';
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
import { UploadDropZone } from '@/components/shared/albums/upload-drop-zone';
import { PhotoGallery } from '@/components/shared/albums/photo-gallery';
import { AlbumHeader } from '@/components/shared/albums/album-header';
import { SelectionHeader } from '@/components/shared/albums/selection-header';
import { StorageIndicator, type StorageInfo } from '@/components/shared/albums/storage-indicator';

// Global Upload Manager
import { getUploadManager } from '@/lib/services/global-upload-manager';
import { useUploadStore } from '@/lib/store/upload';

// Infinite Scroll Hook
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';

export default function AlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imagePreview, setImagePreview] = useState({
    isOpen: false,
    currentIndex: 0,
    zoom: 1,
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMorePhotos, setHasMorePhotos] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const albumId = params.id as string;

  // Subscribe to global upload store for this album's successful uploads
  useEffect(() => {
    const unsubscribe = useUploadStore.subscribe((state, prevState) => {
      // Check for newly successful uploads in this album
      const albumTasks = state.tasks.filter(t => t.albumId === albumId);
      const prevAlbumTasks = prevState.tasks.filter(t => t.albumId === albumId);

      albumTasks.forEach(task => {
        const prevTask = prevAlbumTasks.find(t => t.id === task.id);
        // If task just became successful, add photo to gallery
        if (task.status === 'success' && task.photo && prevTask?.status !== 'success') {
          setPhotos(prev => {
            // Avoid duplicates
            if (prev.some(p => p._id === task.photo!._id)) return prev;
            return [task.photo!, ...prev];
          });

          // Update album stats
          setAlbum(prev => {
            if (!prev) return null;
            return {
              ...prev,
              totalPhotos: prev.totalPhotos + 1,
              storageUsed: (prev.storageUsed || 0) + task.photo!.fileSize,
            };
          });
        }
      });
    });

    return () => unsubscribe();
  }, [albumId]);

  // Fetch album and photos
  useEffect(() => {
    fetchAlbumData();
  }, [albumId]);

  const fetchAlbumData = async () => {
    try {
      setLoading(true);
      const [albumResponse, photosResponse] = await Promise.all([
        albumApi.getAlbum(albumId),
        photoApi.getPhotos(albumId, { page: 1, limit: 30 }),
      ]);

      setAlbum(albumResponse.album);
      setPhotos(photosResponse.photos);
      setPage(1);
      setHasMorePhotos(photosResponse.pagination.page < photosResponse.pagination.pages);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load album',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch more photos for infinite scroll
  const fetchMorePhotos = useCallback(async () => {
    if (loadingMore || !hasMorePhotos) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const photosResponse = await photoApi.getPhotos(albumId, { page: nextPage, limit: 30 });

      setPhotos((prev) => [...prev, ...photosResponse.photos]);
      setPage(nextPage);
      setHasMorePhotos(photosResponse.pagination.page < photosResponse.pagination.pages);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load more photos',
        variant: 'destructive',
      });
    } finally {
      setLoadingMore(false);
    }
  }, [albumId, page, hasMorePhotos, loadingMore, toast]);

  // Infinite scroll hook
  const sentinelRef = useInfiniteScroll({
    fetchMore: fetchMorePhotos,
    hasMore: hasMorePhotos,
    loading: loadingMore,
    rootMargin: '200px',
  });

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
      uploadFiles(validFiles);
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (!album) return;

    const uploadManager = getUploadManager();
    await uploadManager.addFiles(files, albumId, album.title);

    toast({
      title: 'Uploading',
      description: `Added ${files.length} file${files.length > 1 ? 's' : ''} to upload queue`,
    });
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

  const handleExportSelections = () => {
    // Filter selected photos

    const selectedPhotosList = photos.filter(p => p.isClientSelected);
    if (selectedPhotosList.length === 0) {
      toast({
        title: 'No selections',
        description: 'No photos have been selected by clients yet.',
        variant: 'destructive',
      });
      return;
    }

    // Prepare data for Excel
    const data = selectedPhotosList.map(photo => ({
      Filename: photo.originalName,
      Size: photo.fileSize,
      Hash: photo.md5Hash,
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Selections");

    // Generate Excel file
    XLSX.writeFile(wb, `${album?.title || 'Album'}_Selections.xlsx`);

    toast({
      title: 'Success',
      description: 'Exported selections to Excel',
    });
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

  const handleSelectionToggle = async (photoId: string, isClientSelected: boolean) => {
    try {
      await photoApi.toggleSelection(albumId, photoId, isClientSelected);

      // Update local state
      setPhotos(prevPhotos =>
        prevPhotos.map(p =>
          p._id === photoId
            ? { ...p, isClientSelected }
            : p
        )
      );

      toast({
        title: isClientSelected ? 'Photo Selected' : 'Photo Deselected',
        description: isClientSelected ? 'Marked for client selection' : 'Removed from client selection',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update selection',
        variant: 'destructive',
      });
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

  // Helper function to calculate storage info
  const getStorageInfo = (): StorageInfo | null => {
    if (!album || !album.storageLimit) return null;

    const used = album.storageUsed || 0;
    const limit = album.storageLimit;
    const remaining = Math.max(0, limit - used);
    const percentage = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const GB = 1024 * 1024 * 1024;
      const MB = 1024 * 1024;
      const KB = 1024;

      if (bytes >= GB) {
        return `${(bytes / GB).toFixed(2)} GB`;
      } else if (bytes >= MB) {
        return `${(bytes / MB).toFixed(2)} MB`;
      } else if (bytes >= KB) {
        return `${(bytes / KB).toFixed(2)} KB`;
      } else {
        return `${bytes} Bytes`;
      }
    };

    return {
      used,
      limit,
      remaining,
      percentage: Math.round(percentage * 100) / 100,
      usedFormatted: formatBytes(used),
      limitFormatted: formatBytes(limit),
      remainingFormatted: formatBytes(remaining),
    };
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not found state
  if (!album) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Album not found</h2>
        <p className="text-muted-foreground mt-2">This album may have been deleted</p>
        <Button className="mt-4" asChild>
          <Link href="/albums">Back to Albums</Link>
        </Button>
      </div>
    );
  }

  return (
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
              <AlbumHeader
                album={album}
                photos={photos}
                onAddPhotos={() => fileInputRef.current?.click()}
                onShare={() => setShareDialogOpen(true)}
                onEdit={() => setEditDialogOpen(true)}
                onDelete={handleDeleteAlbum}
                onExport={handleExportSelections}
              />
            </div>
            {/* <AlbumActions
                onAddPhotos={() => fileInputRef.current?.click()}
                onShare={() => setShareDialogOpen(true)}
                onEdit={() => setEditDialogOpen(true)}
                onDelete={handleDeleteAlbum}
              /> */}
            {/* Storage Indicator */}
            {getStorageInfo() && (
              <StorageIndicator
                storageInfo={getStorageInfo()!}
                compact={true}
              />
            )}
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

      {/* Note: Upload progress is now shown in the global GlobalUploadPanel */}

      {/* Photo Gallery */}
      <PhotoGallery
        photos={photos}
        selectedPhotos={selectedPhotos}
        hasSelection={selectedPhotos.size > 0}
        // onPhotoClick={openImagePreview}
        onPhotoSelect={togglePhotoSelection}
        onSelectionToggle={handleSelectionToggle}
        useInternalPreview={true}
      />

      {/* Infinite Scroll Sentinel */}
      {hasMorePhotos && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {loadingMore && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading more photos...</span>
            </div>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      {/* <ImagePreviewModal
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
          onSelectionToggle={handleSelectionToggle}
        /> */}
    </div>
  );
}
