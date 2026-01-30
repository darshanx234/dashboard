'use client';

import { useEffect, useState } from 'react';
import { useUploadStore, AlbumUploadGroup } from '@/lib/store/upload';
import { getUploadManager } from '@/lib/services/global-upload-manager';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    ChevronDown,
    ChevronUp,
    X,
    Minimize2,
    Maximize2,
    Upload,
    CheckCircle2,
    XCircle,
    Loader2,
    RotateCcw,
    Trash2,
    FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function TaskStatusIcon({ status }: { status: string }) {
    switch (status) {
        case 'success':
            return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        case 'error':
            return <XCircle className="h-4 w-4 text-red-500" />;
        case 'uploading':
            return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
        case 'cancelled':
            return <X className="h-4 w-4 text-muted-foreground" />;
        default:
            return <div className="h-4 w-4 rounded-full bg-muted" />;
    }
}

interface AlbumSectionProps {
    group: AlbumUploadGroup;
    onToggle: () => void;
    onCancelAlbum: () => void;
    onRetryAlbum: () => void;
    onClearCompleted: () => void;
}

function AlbumSection({
    group,
    onToggle,
    onCancelAlbum,
    onRetryAlbum,
    onClearCompleted,
}: AlbumSectionProps) {
    const uploadManager = getUploadManager();
    const albumProgress = Math.round(
        (group.completedFiles / group.totalFiles) * 100
    ) || 0;

    const hasErrors = group.failedFiles > 0;
    const activeTasks = group.tasks.filter(
        (t) => t.status !== 'success' && t.status !== 'cancelled'
    );

    return (
        <div className="border rounded-lg overflow-hidden bg-card w-full">
            {/* Album Header */}
            <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                onClick={onToggle}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {group.isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                    ) : (
                        <ChevronUp className="h-4 w-4 shrink-0" />
                    )}
                    <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{group.albumTitle}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                        ({group.completedFiles}/{group.totalFiles})
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {hasErrors && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRetryAlbum();
                            }}
                            title="Retry failed"
                        >
                            <RotateCcw className="h-3 w-3" />
                        </Button>
                    )}
                    {group.completedFiles > 0 && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClearCompleted();
                            }}
                            title="Clear completed"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    )}
                    {activeTasks.length > 0 && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-destructive hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                onCancelAlbum();
                            }}
                            title="Cancel all"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div className="px-3 pb-2">
                <Progress value={albumProgress} className="h-1" />
            </div>

            {/* File list */}
            {group.isExpanded && (
                <div className="border-t max-h-48 overflow-y-auto overflow-x-hidden">
                    {group.tasks.map((task) => (
                        <div
                            key={task.id}
                            className={cn(
                                'flex items-center gap-2 px-3 py-2 text-sm border-b last:border-b-0',
                                task.status === 'success' && 'bg-green-50 dark:bg-green-950/20',
                                task.status === 'error' && 'bg-red-50 dark:bg-red-950/20'
                            )}
                        >
                            <TaskStatusIcon status={task.status} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="truncate text-xs">{task.fileName}</span>
                                    <span className="text-xs text-muted-foreground shrink-0">
                                        {formatFileSize(task.fileSize)}
                                    </span>
                                </div>
                                {(task.status === 'uploading' || task.status === 'pending') && (
                                    <Progress value={task.progress} className="h-1 mt-1" />
                                )}
                                {task.error && (
                                    <p className="text-xs text-red-500 mt-0.5 truncate">
                                        {task.error}
                                    </p>
                                )}
                            </div>
                            {task.status === 'error' && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => {
                                        useUploadStore.getState().retryTask(task.id);
                                        uploadManager.startProcessing();
                                    }}
                                >
                                    <RotateCcw className="h-3 w-3" />
                                </Button>
                            )}
                            {(task.status === 'uploading' || task.status === 'pending') && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-destructive"
                                    onClick={() => uploadManager.cancelUpload(task.id)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function GlobalUploadPanel() {
    const {
        tasks,
        isProcessing,
        isPanelOpen,
        isPanelMinimized,
        togglePanel,
        minimizePanel,
        maximizePanel,
        toggleAlbumExpanded,
        clearCompleted,
        getAlbumGroups,
        getActiveCount,
        getTotalProgress,
    } = useUploadStore();

    const [mounted, setMounted] = useState(false);
    const uploadManager = getUploadManager();
    const albumGroups = getAlbumGroups();
    const activeCount = getActiveCount();
    const totalProgress = getTotalProgress();

    // Initialize upload manager on mount
    useEffect(() => {
        setMounted(true);
        // Initialize the singleton (will restore from DB)
        getUploadManager();
    }, []);

    // Don't render on server or if no tasks
    if (!mounted || tasks.length === 0) {
        return null;
    }

    // Minimized state - just show badge
    if (isPanelMinimized) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <Button
                    onClick={maximizePanel}
                    className="rounded-full h-14 w-14 shadow-lg relative"
                    size="icon"
                >
                    <Upload className="h-6 w-6" />
                    {activeCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {activeCount}
                        </span>
                    )}
                    {isProcessing && (
                        <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-50" />
                    )}
                </Button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] shadow-2xl rounded-lg border bg-background overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Uploads</span>
                    {activeCount > 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {activeCount} active
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={minimizePanel}
                    >
                        <Minimize2 className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                            if (activeCount > 0) {
                                if (confirm('Cancel all uploads?')) {
                                    uploadManager.cancelAll();
                                }
                            } else {
                                clearCompleted();
                            }
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Overall progress */}
            {activeCount > 0 && (
                <div className="px-3 py-2 border-b">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Overall Progress</span>
                        <span className="font-medium">{totalProgress}%</span>
                    </div>
                    <Progress value={totalProgress} className="h-2" />
                </div>
            )}

            {/* Album groups */}

            <div className="p-3 space-y-2 w-full">
                {albumGroups.map((group) => (
                    <AlbumSection
                        key={group.albumId}
                        group={group}
                        onToggle={() => toggleAlbumExpanded(group.albumId)}
                        onCancelAlbum={() => uploadManager.cancelAlbumUploads(group.albumId)}
                        onRetryAlbum={() => uploadManager.retryFailed(group.albumId)}
                        onClearCompleted={() => clearCompleted(group.albumId)}
                    />
                ))}
            </div>


            {/* Footer */}
            <div className="p-2 border-t bg-muted/30 flex justify-between items-center">
                <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => clearCompleted()}
                >
                    Clear Completed
                </Button>
                {albumGroups.length > 0 && (
                    <Link
                        href={`/albums/${albumGroups[0].albumId}`}
                        className="text-xs text-primary hover:underline"
                    >
                        View Album
                    </Link>
                )}
            </div>
        </div>
    );
}
