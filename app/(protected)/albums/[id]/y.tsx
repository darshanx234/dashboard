'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Upload,
  Share2,
  Download,
  Settings,
  Eye,
  Heart,
  Trash2,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Plus,
  Check,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
} from 'lucide-react';
import Link from 'next/link';
import { albumApi, photoApi, uploadApi, type Album, type Photo } from '@/lib/api/albums';
import { useToast } from '@/hooks/use-toast';
import { ShareDialog } from '@/components/albums/share-dialog';
import { EditAlbumDialog } from '@/components/albums/edit-album-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  photo?: Photo;
}

interface ImagePreviewState {
  isOpen: boolean;
  currentIndex: number;
  zoom: number;
}

// Move S3 env variables to top-level constants for client-side usage
const S3_BUCKET =  'photoalumnus';
const S3_REGION =  'ap-south-1';

export default function AlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadPanelExpanded, setUploadPanelExpanded] = useState(true);
  const [cancellingUpload, setCancellingUpload] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imagePreview, setImagePreview] = useState<ImagePreviewState>({
    isOpen: false,
    currentIndex: 0,
    zoom: 1,
  });

  const albumId = params.id as string;

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    processFiles(files);

    // Reset input
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
    // Only set dragging to false if we're leaving the main container
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

  const handleCancelUpload = () => {
    if (confirm('Are you sure you want to cancel all uploads?')) {
      setCancellingUpload(true);
      // Clear uploading files
      setUploadingFiles([]);
      setIsUploading(false);
      setCancellingUpload(false);
      toast({
        title: 'Cancelled',
        description: 'Upload cancelled',
      });
    }
  };

  const processFiles = (files: File[]) => {
    // Validate files
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

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);

    // Initialize uploading files state
    const newUploadingFiles: UploadingFile[] = files.map((file) => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadingFiles(newUploadingFiles);

    // Upload files sequentially
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];

        // Update progress
        setUploadingFiles((prev) =>
          prev.map((uf, index) =>
            index === i ? { ...uf, progress: 10 } : uf
          )
        );

        // Step 1: Get pre-signed URL
        const { uploadUrl, s3Key } = await uploadApi.getPresignedUrl({
          albumId,
          filename: file.name,
          mimeType: file.type,
          fileSize: file.size,
        });

        setUploadingFiles((prev) =>
          prev.map((uf, index) =>
            index === i ? { ...uf, progress: 30 } : uf
          )
        );

        // Step 2: Upload to S3
        await uploadApi.uploadToS3(uploadUrl, file);

        setUploadingFiles((prev) =>
          prev.map((uf, index) =>
            index === i ? { ...uf, progress: 70 } : uf
          )
        );

        // Step 3: Get image dimensions
        let width: number | undefined;
        let height: number | undefined;

        if (file.type.startsWith('image/')) {
          try {
            const dimensions = await getImageDimensions(file);
            width = dimensions.width;
            height = dimensions.height;
          } catch (e) {
            console.error('Failed to get image dimensions:', e);
          }
        }

        setUploadingFiles((prev) =>
          prev.map((uf, index) =>
            index === i ? { ...uf, progress: 80 } : uf
          )
        );

        // Step 4: Create photo record
        const s3Url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;

        const { photo } = await photoApi.createPhoto(albumId, {
          filename: file.name,
          originalName: file.name,
          s3Key,
          s3Url,
          fileSize: file.size,
          mimeType: file.type,
          width,
          height,
          order: photos.length + i,
        });

        // Update success
        setUploadingFiles((prev) =>
          prev.map((uf, index) =>
            index === i
              ? { ...uf, progress: 100, status: 'success', photo }
              : uf
          )
        );

        // fetchAlbumData();

        // Add to photos list
        setPhotos((prev) => [...prev, photo]);

        // Update album photo count
        if (album) {
          setAlbum({ ...album, totalPhotos: album.totalPhotos + 1 });
        }
      } catch (error: any) {
        console.error(`Upload failed for ${files[i].name}:`, error);
        setUploadingFiles((prev) =>
          prev.map((uf, index) =>
            index === i
              ? {
                ...uf,
                status: 'error',
                error: error.message || 'Upload failed',
              }
              : uf
          )
        );

        toast({
          title: 'Upload failed',
          description: `Failed to upload ${files[i].name}`,
          variant: 'destructive',
        });
      }
    }

    setIsUploading(false);

    // Show success message
    const successCount = uploadingFiles.filter((uf) => uf.status === 'success').length;
    if (successCount > 0) {
      toast({
        title: 'Upload complete',
        description: `Successfully uploaded ${successCount} photo${successCount > 1 ? 's' : ''}`,
      });
    }
  };

  const clearUploadingFiles = () => {
    setUploadingFiles([]);
  };

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

  const togglePhotoSelection = (photoId: string, e: React.MouseEvent) => {
    // e.preventDefault();
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
    setSelectedPhotos(new Set(photos.map(p => p._id)));
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

      // Close image preview modal if open
      if (imagePreview.isOpen) {
        closeImagePreview();
      }

      // Refresh album data
      await fetchAlbumData();

      // Clear selection
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

  // Image Preview Functions
  const openImagePreview = (index: number) => {
    setImagePreview({ isOpen: true, currentIndex: index, zoom: 1 });
    document.body.style.overflow = 'hidden';
  };

  const closeImagePreview = () => {
    setImagePreview({ isOpen: false, currentIndex: 0, zoom: 1 });
    document.body.style.overflow = 'unset';
  };

  const goToNextImage = () => {
    setImagePreview(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % photos.length,
      zoom: 1,
    }));
  };

  const goToPrevImage = () => {
    setImagePreview(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? photos.length - 1 : prev.currentIndex - 1,
      zoom: 1,
    }));
  };

  const handleZoomIn = () => {
    setImagePreview(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.5, 3) }));
  };

  const handleZoomOut = () => {
    setImagePreview(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.5, 0.5) }));
  };

  const handleResetZoom = () => {
    setImagePreview(prev => ({ ...prev, zoom: 1 }));
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!imagePreview.isOpen) return;

      switch (e.key) {
        case 'Escape':
          closeImagePreview();
          break;
        case 'ArrowLeft':
          goToPrevImage();
          break;
        case 'ArrowRight':
          goToNextImage();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
        case '_':
          handleZoomOut();
          break;
        case '0':
          handleResetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imagePreview.isOpen, photos.length]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

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
        {/* Drag Overlay */}
        {isDragging && (
          <div className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
            <div className="bg-background border-2 border-dashed border-primary rounded-lg p-12 text-center shadow-xl">
              <Upload className="h-16 w-16 mx-auto text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-2">Drop photos here</h3>
              <p className="text-muted-foreground">Release to upload to {album?.title}</p>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
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

        {/* Header with Integrated Stats */}
        <div className="flex flex-col gap-4">
          {selectedPhotos.size > 0 ? (
            /* Selection Mode Header */
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4 border">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">
                      {selectedPhotos.size} Photo{selectedPhotos.size > 1 ? 's' : ''} Selected
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedPhotos.size === photos.length ? 'All photos selected' : `${photos.length - selectedPhotos.size} remaining`}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {selectedPhotos.size < photos.length && (
                  <Button variant="outline" size="sm" onClick={selectAllPhotos}>
                    <Check className="h-4 w-4 mr-2" />
                    Select All
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={deselectAllPhotos}
                  title="Deselect all"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={() => setDeleteDialogOpen(true)}
                  title="Delete selected photos"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            /* Normal Mode Header */
            <>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold">{album.title}</h1>
                      {album.description && (
                        <p className="text-muted-foreground mt-2 max-w-2xl">{album.description}</p>
                      )}
                    </div>
                    <Badge variant={album.status === 'published' ? 'default' : 'secondary'} className="ml-4">
                      {album.status}
                    </Badge>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center gap-4 mt-4 text-sm">
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
                            day: 'numeric'
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
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Photos
                </Button>
                <Button variant="outline" onClick={() => setShareDialogOpen(true)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDeleteAlbum}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedPhotos.size} photo{selectedPhotos.size > 1 ? 's' : ''}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the selected photo{selectedPhotos.size > 1 ? 's' : ''} from the album and remove {selectedPhotos.size > 1 ? 'them' : 'it'} from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting} onClick={() => setDeleteDialogOpen(false)  }>Cancel</AlertDialogCancel>
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

        {/* Expandable Upload Panel - Bottom Right */}
        {uploadingFiles.length > 0 && (
          <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
            {/* Expanded Panel */}
            {uploadPanelExpanded && (
              <Card className="w-96 max-h-[500px] shadow-2xl border-2 animate-in slide-in-from-bottom-4">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b bg-muted/50">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Upload className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">
                          {isUploading ? 'Uploading Photos' : 'Upload Complete'}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {uploadingFiles.filter(f => f.status === 'success').length} of {uploadingFiles.length} complete
                        </p>
                      </div>
                      {/* Overall Progress Badge */}
                      <Badge variant="secondary" className="flex-shrink-0">
                        {Math.round(uploadingFiles.reduce((acc, file) => acc + file.progress, 0) / uploadingFiles.length)}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setUploadPanelExpanded(false)}
                        title="Minimize"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>  

                  {/* Progress Overview Bar */}
                  <div className="px-4 pt-3 pb-2 bg-muted/30 border-b">
                    <Progress
                      value={uploadingFiles.reduce((acc, file) => acc + file.progress, 0) / uploadingFiles.length}
                      className="h-2"
                    />
                  </div>

                  {/* File List */}
                  <div className="max-h-[280px] overflow-y-auto">
                    {uploadingFiles.map((uploadingFile, index) => (
                      <div key={index} className="p-3 border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-3">
                          {/* Status Icon */}
                          <div className="flex-shrink-0 mt-0.5">
                            {uploadingFile.status === 'uploading' && (
                              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            )}
                            {uploadingFile.status === 'success' && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            {uploadingFile.status === 'error' && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>

                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {uploadingFile.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(uploadingFile.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>

                            {/* Progress Bar */}
                            {uploadingFile.status === 'uploading' && (
                              <div className="mt-2">
                                <Progress value={uploadingFile.progress} className="h-1" />
                              </div>
                            )}

                            {/* Error Message */}
                            {uploadingFile.error && (
                              <p className="text-xs text-red-500 mt-1">
                                {uploadingFile.error}
                              </p>
                            )}
                          </div>

                          {/* Progress Percentage */}
                          <div className="flex-shrink-0 text-xs font-medium text-muted-foreground">
                            {uploadingFile.progress}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions Footer */}
                  <div className="p-3 border-t bg-muted/30 flex gap-2">
                    {isUploading ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={handleCancelUpload}
                        disabled={cancellingUpload}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Upload
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add More
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            clearUploadingFiles();
                            setUploadPanelExpanded(false);
                          }}
                        >
                          Done
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Collapsed Button */}
            {!uploadPanelExpanded && (
              <Button
                onClick={() => setUploadPanelExpanded(true)}
                className="shadow-lg h-12 px-6 rounded-full animate-in slide-in-from-bottom-2"
                size="lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading {uploadingFiles.filter(f => f.status === 'uploading').length}/{uploadingFiles.length}
                    <Badge variant="secondary" className="ml-2 bg-white/20 hover:bg-white/30">
                      {Math.round(uploadingFiles.reduce((acc, file) => acc + file.progress, 0) / uploadingFiles.length)}%
                    </Badge>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {uploadingFiles.filter(f => f.status === 'success').length} Uploaded
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Photos Masonry Gallery */}
        <div>
          {photos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Upload your first photos to get started. Drag and drop or click "Add Photos"
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
              {photos.map((photo, index) => {
                const isSelected = selectedPhotos.has(photo._id);
                return (
                  <div
                    key={photo._id}
                    className="break-inside-avoid mb-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      openImagePreview(index);
                    }}
                  >
                    <div className={`group relative overflow-hidden rounded-lg bg-muted hover:shadow-xl transition-all duration-300 cursor-pointer ${isSelected ? 'scale-95 opacity-70' : ''}`}>
                      {/* Selection Circle Button */}
                      <div
                        className={`absolute top-3 left-3 z-20 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePhotoSelection(photo._id, e);
                        }}
                      >
                        <div
                          className={`w-6 h-6 rounded-full cursor-pointer flex items-center justify-center transition-all duration-200 ${isSelected
                              ? 'bg-primary border-2 border-primary shadow-lg'
                              : 'bg-white/10 border-2 border-white/50 hover:bg-white hover:border-white hover:scale-110'
                            }`}
                        >
                          { !isSelected && <Check className="h-4 w-4 text-transparent hover:scale-110 hover:text-primary" />}
                          {isSelected && <Check className="h-5 w-5 text-primary-foreground" />}
                        </div>
                      </div>

                      {photo.url || photo.thumbnailUrl ? (
                        <img
                          src={photo.thumbnailUrl || photo.url}
                          alt={photo.originalName}
                          className={`w-full h-auto object-cover transition-all duration-300 ${isSelected ? 'scale-95' : 'group-hover:scale-105'}`}
                          loading="lazy"
                          onClick={() => !isSelected && openImagePreview(index)}
                        />
                      ) : (
                        <div className="w-full aspect-square flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {/* Photo Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                          <p className="text-xs font-medium truncate">{photo.originalName}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-white/80">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {photo.views}
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {photo.downloads}
                            </span>
                            {photo.favoritesCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3 fill-current" />
                                {photo.favoritesCount}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              openImagePreview(index);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = document.createElement('a');
                              link.href = photo.url || photo.thumbnailUrl || '';
                              link.download = photo.originalName;
                              link.click();
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Favorite Badge */}
                      {photo.favoritesCount > 0 && (
                        <Badge
                          variant="secondary"
                          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm group-hover:opacity-0 transition-opacity"
                        >
                          <Heart className="h-3 w-3 mr-1 fill-current text-red-500" />
                          {photo.favoritesCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Image Preview Modal */}
        {imagePreview.isOpen && photos.length > 0 && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            style={{ margin: 0 }}>
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/10 h-10 w-10"
              onClick={closeImagePreview}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Image Counter */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-white text-sm font-medium">
                {imagePreview.currentIndex + 1} / {photos.length}
              </span>
            </div>

            {/* Navigation Buttons */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/10 h-12 w-12"
                  onClick={goToPrevImage}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/10 h-12 w-12"
                  onClick={goToNextImage}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 z-10 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 h-10 w-10"
                onClick={handleZoomOut}
                disabled={imagePreview.zoom <= 0.5}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 px-3"
                onClick={handleResetZoom}
              >
                {Math.round(imagePreview.zoom * 100)}%
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 h-10 w-10"
                onClick={handleZoomIn}
                disabled={imagePreview.zoom >= 3}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
            </div>

            {/* Image Info and Actions */}
            <div className="absolute bottom-4 left-4 z-10 max-w-md">
              <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
                <h3 className="font-semibold text-sm mb-2">{photos[imagePreview.currentIndex]?.originalName}</h3>
                <div className="flex items-center gap-4 text-xs text-white/80">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {photos[imagePreview.currentIndex]?.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {photos[imagePreview.currentIndex]?.downloads}
                  </span>
                  {photos[imagePreview.currentIndex]?.favoritesCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3 fill-current" />
                      {photos[imagePreview.currentIndex]?.favoritesCount}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const photo = photos[imagePreview.currentIndex];
                      const link = document.createElement('a');
                      link.href = photo.url || photo.thumbnailUrl || '';
                      link.download = photo.originalName;
                      link.click();
                    }}
                  >
                    <Download className="h-3 w-3 mr-1.5" />
                    Download
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Image Container */}
            <div className="relative w-full h-full flex items-center justify-center p-20 overflow-auto">
              <img
                src={photos[imagePreview.currentIndex]?.url || photos[imagePreview.currentIndex]?.thumbnailUrl}
                alt={photos[imagePreview.currentIndex]?.originalName}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${imagePreview.zoom})`,
                  cursor: imagePreview.zoom > 1 ? 'grab' : 'default'
                }}
                draggable={false}
              />
            </div>

            {/* Keyboard Shortcuts Info */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-1.5 text-white/60 text-xs">
                Use arrow keys to navigate • ESC to close • +/- to zoom
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Helper function to get image dimensions
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}
