'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Upload,
    X,
    Loader2,
    CheckCircle,
    AlertCircle,
    Plus,
} from 'lucide-react';

export interface UploadingFile {
    id: string;
    file: File;
    progress: number;
    status: 'uploading' | 'success' | 'error';
    error?: string;
    photo?: any;
}

interface UploadProgressPanelProps {
    uploadingFiles: UploadingFile[];
    isUploading: boolean;
    isExpanded: boolean;
    onToggleExpand: (expanded: boolean) => void;
    onCancel: () => void;
    onClear: () => void;
    onAddMore: () => void;
}

export function UploadProgressPanel({
    uploadingFiles,
    isUploading,
    isExpanded,
    onToggleExpand,
    onCancel,
    onClear,
    onAddMore,
}: UploadProgressPanelProps) {
    if (uploadingFiles.length === 0) return null;

    const successCount = uploadingFiles.filter((f) => f.status === 'success').length;
    const overallProgress = Math.round(
        uploadingFiles.reduce((acc, file) => acc + file.progress, 0) / uploadingFiles.length
    );

    return (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
            {/* Expanded Panel */}
            {isExpanded && (
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
                                        {successCount} of {uploadingFiles.length} complete
                                    </p>
                                </div>
                                {/* Overall Progress Badge */}
                                <Badge variant="secondary" className="flex-shrink-0">
                                    {overallProgress}%
                                </Badge>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => onToggleExpand(false)}
                                    title="Minimize"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Progress Overview Bar */}
                        <div className="px-4 pt-3 pb-2 bg-muted/30 border-b"></div>

                        {/* File List */}
                        <div className="max-h-[280px] overflow-y-auto">
                            {uploadingFiles.map((uploadingFile) => (
                                <div
                                    key={uploadingFile.id}
                                    className="p-3 border-b last:border-0 hover:bg-muted/50 transition-colors"
                                >
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
                                    onClick={onCancel}
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
                                        onClick={onAddMore}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add More
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => {
                                            onClear();
                                            onToggleExpand(false);
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
            {!isExpanded && (
                <Button
                    onClick={() => onToggleExpand(true)}
                    className="shadow-lg h-12 px-6 rounded-full animate-in slide-in-from-bottom-2"
                    size="lg"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading {uploadingFiles.filter((f) => f.status === 'uploading').length}/
                            {uploadingFiles.length}
                            <Badge variant="secondary" className="ml-2 bg-white/20 hover:bg-white/30">
                                {overallProgress}%
                            </Badge>
                        </>
                    ) : (
                        <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {successCount} Uploaded
                        </>
                    )}
                </Button>
            )}
        </div>
    );
}
