'use client';

import { Upload } from 'lucide-react';

interface UploadDropZoneProps {
    albumTitle?: string;
    isDragging: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadDropZone({
    albumTitle,
    isDragging,
    onDragOver,
    onDragLeave,
    onDrop,
    fileInputRef,
    onFileSelect,
}: UploadDropZoneProps) {
    return (
        <>
            {/* Drag Overlay */}
            {isDragging && (
                <div className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                    <div className="bg-background border-2 border-dashed border-primary rounded-lg p-12 text-center shadow-xl">
                        <Upload className="h-16 w-16 mx-auto text-primary mb-4" />
                        <h3 className="text-2xl font-bold mb-2">Drop photos here</h3>
                        <p className="text-muted-foreground">Release to upload to {albumTitle}</p>
                    </div>
                </div>
            )}

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={onFileSelect}
                className="hidden"
            />
        </>
    );
}
