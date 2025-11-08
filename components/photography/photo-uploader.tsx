'use client';

import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

interface PhotoUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  isLoading?: boolean;
}

export function PhotoUploader({ onUpload, isLoading = false }: PhotoUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );
    addFiles(droppedFiles);
  }, []);

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));
    setFiles(prev => [...prev, ...uploadFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.currentTarget.files || []);
    addFiles(selectedFiles);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const filesToUpload = files.filter(f => f.status === 'pending').map(f => f.file);
    if (filesToUpload.length === 0) return;

    try {
      await onUpload(filesToUpload);
      setFiles(prev =>
        prev.map(f => ({
          ...f,
          status: f.status === 'pending' ? 'complete' : f.status,
          progress: f.status === 'pending' ? 100 : f.progress,
        }))
      );
    } catch (error) {
      setFiles(prev =>
        prev.map(f => ({
          ...f,
          status: f.status === 'uploading' ? 'error' : f.status,
          error: f.status === 'uploading' ? 'Upload failed' : f.error,
        }))
      );
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const completeCount = files.filter(f => f.status === 'complete').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Photos</CardTitle>
        <CardDescription>
          Add photos to your album using drag-and-drop or file browser
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="font-medium mb-1">Drop photos here or click to select</p>
          <p className="text-sm text-muted-foreground mb-4">
            Supports JPG, PNG, and other image formats
          </p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
            disabled={isLoading}
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('file-input')?.click()}
            disabled={isLoading}
          >
            Select Files
          </Button>
        </div>

        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">
                {completeCount} uploaded • {pendingCount} pending
              </span>
              {pendingCount > 0 && (
                <Button
                  onClick={handleUpload}
                  disabled={isLoading}
                  size="sm"
                >
                  Upload {pendingCount} Photo{pendingCount !== 1 ? 's' : ''}
                </Button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {files.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <img
                    src={URL.createObjectURL(item.file)}
                    alt={item.file.name}
                    className="h-12 w-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {item.status === 'uploading' && (
                      <div className="mt-1 w-full bg-secondary rounded-full h-1 overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                    {item.status === 'complete' && (
                      <div className="flex items-center gap-1 mt-1 text-green-600 text-xs">
                        <CheckCircle className="h-3 w-3" />
                        Uploaded
                      </div>
                    )}
                    {item.status === 'error' && (
                      <p className="text-xs text-red-600 mt-1">{item.error}</p>
                    )}
                  </div>
                  {item.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      disabled={isLoading}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
