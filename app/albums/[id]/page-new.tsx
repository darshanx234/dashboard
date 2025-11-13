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
} from 'lucide-react';
import Link from 'next/link';
import { albumApi, photoApi, uploadApi, type Album, type Photo } from '@/lib/api/albums';
import { useToast } from '@/hooks/use-toast';

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  photo?: Photo;
}

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

  const albumId = params.id as string;

  // Fetch album and photos
  useEffect(() => {
    fetchAlbumData();
  }, [albumId]);

  const fetchAlbumData = async () => {
    console.log("hello after update");
    try {
      setLoading(true);
      const [albumResponse, photosResponse] = await Promise.all([
        albumApi.getAlbum(albumId),
        photoApi.getPhotos(albumId, { limit: 100 }),
      ]);

      setAlbum(albumResponse.album);
      setPhotos(photosResponse.photos);
    } catch (error: any) {
      console.error('Fetch album error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load album',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

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
      uploadFiles(validFiles);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
        const s3Url = `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || 'photoalumnus'}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1'}.amazonaws.com/${s3Key}`;

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

        // Add to photos list
        setPhotos((prev) => [...prev, photo]);

        // Update album photo count
        if (album) {
          setAlbum({ ...album, totalPhotos: album.totalPhotos + 1 });
        }

        // fetchAlbumData();


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
      <div className="space-y-6">
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{album.title}</h1>
            {album.description && (
              <p className="text-muted-foreground mt-2">{album.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {album.shootDate && <span>{new Date(album.shootDate).toLocaleDateString()}</span>}
              {album.location && <span>• {album.location}</span>}
              <Badge variant="secondary">{album.status}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAlbum}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{album.totalPhotos}</div>
              <p className="text-xs text-muted-foreground">Photos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{album.totalViews}</div>
              <p className="text-xs text-muted-foreground">Views</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{album.totalDownloads}</div>
              <p className="text-xs text-muted-foreground">Downloads</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {photos.filter((p) => p.favoritesCount > 0).length}
              </div>
              <p className="text-xs text-muted-foreground">Favorites</p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Photos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop or click to browse (Max 50MB per file)
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Select Photos
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upload Progress */}
        {uploadingFiles.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Uploading Files</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearUploadingFiles}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {uploadingFiles.map((uploadingFile, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1">{uploadingFile.file.name}</span>
                      <div className="flex items-center gap-2">
                        {uploadingFile.status === 'uploading' && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        )}
                        {uploadingFile.status === 'success' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {uploadingFile.status === 'error' && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {uploadingFile.progress}%
                        </span>
                      </div>
                    </div>
                    <Progress value={uploadingFile.progress} />
                    {uploadingFile.error && (
                      <p className="text-xs text-red-500">{uploadingFile.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photos Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Photos ({photos.length})</h2>
          {photos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Upload your first photos to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <Card key={photo._id} className="overflow-hidden group relative">
                  <div className="aspect-square bg-muted flex items-center justify-center relative">
                    {photo.s3Url ? (
                      <img
                        src={photo.s3Url}
                        alt={photo.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    )}

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Favorite Badge */}
                    {photo.favoritesCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="absolute top-2 right-2"
                      >
                        <Heart className="h-3 w-3 mr-1 fill-current" />
                        {photo.favoritesCount}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
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
