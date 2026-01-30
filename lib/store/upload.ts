import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Photo } from '@/lib/api/albums';
import * as uploadDb from '@/lib/services/upload-db';

// Upload task interface
export interface UploadTask {
    id: string;
    albumId: string;
    albumTitle: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    status: 'pending' | 'uploading' | 'success' | 'error' | 'cancelled' | 'paused';
    progress: number;
    error?: string;
    retryCount: number;
    photo?: Photo;
    createdAt: number;
}

// Album group for UI display
export interface AlbumUploadGroup {
    albumId: string;
    albumTitle: string;
    tasks: UploadTask[];
    totalFiles: number;
    completedFiles: number;
    failedFiles: number;
    isExpanded: boolean;
}

interface UploadStore {
    // State
    tasks: UploadTask[];
    isProcessing: boolean;
    isPanelOpen: boolean;
    isPanelMinimized: boolean;
    expandedAlbums: Set<string>;

    // Actions
    addTasks: (files: File[], albumId: string, albumTitle: string) => Promise<string[]>;
    updateTaskProgress: (taskId: string, progress: number) => void;
    updateTaskStatus: (taskId: string, status: UploadTask['status'], error?: string) => void;
    setTaskSuccess: (taskId: string, photo: Photo) => void;
    cancelTask: (taskId: string) => void;
    cancelAlbumTasks: (albumId: string) => void;
    retryTask: (taskId: string) => void;
    retryAlbumTasks: (albumId: string) => void;
    clearCompleted: (albumId?: string) => void;
    clearAll: () => void;

    // Processing control
    setProcessing: (isProcessing: boolean) => void;

    // UI controls
    togglePanel: () => void;
    minimizePanel: () => void;
    maximizePanel: () => void;
    toggleAlbumExpanded: (albumId: string) => void;

    // Restore from IndexedDB
    restoreFromDB: () => Promise<void>;

    // Getters
    getTasksByAlbum: (albumId: string) => UploadTask[];
    getAlbumGroups: () => AlbumUploadGroup[];
    getPendingTasks: () => UploadTask[];
    getActiveCount: () => number;
    getTotalProgress: () => number;
}

export const useUploadStore = create<UploadStore>()(
    persist(
        (set, get) => ({
            // Initial state
            tasks: [],
            isProcessing: false,
            isPanelOpen: false,
            isPanelMinimized: false,
            expandedAlbums: new Set<string>(),

            // Add new tasks
            addTasks: async (files: File[], albumId: string, albumTitle: string) => {
                const taskIds: string[] = [];
                const newTasks: UploadTask[] = [];
                const now = Date.now();

                for (const file of files) {
                    const taskId = `${now}-${Math.random().toString(36).substr(2, 9)}`;

                    // Save to IndexedDB for persistence
                    if (uploadDb.isIndexedDBSupported()) {
                        await uploadDb.saveUploadTask(taskId, file, albumId, albumTitle);
                    }

                    const task: UploadTask = {
                        id: taskId,
                        albumId,
                        albumTitle,
                        fileName: file.name,
                        fileSize: file.size,
                        mimeType: file.type,
                        status: 'pending',
                        progress: 0,
                        retryCount: 0,
                        createdAt: now,
                    };

                    newTasks.push(task);
                    taskIds.push(taskId);
                }

                set((state) => ({
                    tasks: [...state.tasks, ...newTasks],
                    isPanelOpen: true,
                    isPanelMinimized: false,
                    expandedAlbums: new Set([...state.expandedAlbums, albumId]),
                }));

                return taskIds;
            },

            // Update task progress
            updateTaskProgress: (taskId: string, progress: number) => {
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === taskId ? { ...task, progress } : task
                    ),
                }));
            },

            // Update task status
            updateTaskStatus: (taskId: string, status: UploadTask['status'], error?: string) => {
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === taskId
                            ? {
                                ...task,
                                status,
                                error: error || task.error,
                                retryCount: status === 'error' ? task.retryCount + 1 : task.retryCount,
                            }
                            : task
                    ),
                }));

                // Update IndexedDB
                if (uploadDb.isIndexedDBSupported() && status !== 'success') {
                    uploadDb.updateTaskStatus(
                        taskId,
                        status as 'pending' | 'uploading' | 'paused' | 'error',
                        undefined,
                        error
                    );
                }
            },

            // Mark task as successful and store photo
            setTaskSuccess: (taskId: string, photo: Photo) => {
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === taskId
                            ? { ...task, status: 'success' as const, progress: 100, photo }
                            : task
                    ),
                }));

                // Remove from IndexedDB after success
                if (uploadDb.isIndexedDBSupported()) {
                    uploadDb.deleteUploadTask(taskId);
                }
            },

            // Cancel a single task
            cancelTask: (taskId: string) => {
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === taskId ? { ...task, status: 'cancelled' as const } : task
                    ),
                }));

                // Remove from IndexedDB
                if (uploadDb.isIndexedDBSupported()) {
                    uploadDb.deleteUploadTask(taskId);
                }
            },

            // Cancel all tasks for an album
            cancelAlbumTasks: (albumId: string) => {
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.albumId === albumId && task.status !== 'success'
                            ? { ...task, status: 'cancelled' as const }
                            : task
                    ),
                }));

                // Clear from IndexedDB
                if (uploadDb.isIndexedDBSupported()) {
                    uploadDb.clearAlbumTasks(albumId);
                }
            },

            // Retry a failed task
            retryTask: (taskId: string) => {
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === taskId && task.status === 'error'
                            ? { ...task, status: 'pending' as const, progress: 0, error: undefined }
                            : task
                    ),
                }));
            },

            // Retry all failed tasks for an album
            retryAlbumTasks: (albumId: string) => {
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.albumId === albumId && task.status === 'error'
                            ? { ...task, status: 'pending' as const, progress: 0, error: undefined }
                            : task
                    ),
                }));
            },

            // Clear completed tasks
            clearCompleted: (albumId?: string) => {
                set((state) => ({
                    tasks: state.tasks.filter((task) => {
                        if (albumId && task.albumId !== albumId) return true;
                        return task.status !== 'success' && task.status !== 'cancelled';
                    }),
                }));
            },

            // Clear all tasks
            clearAll: () => {
                set({ tasks: [], isPanelOpen: false });
            },

            // Set processing state
            setProcessing: (isProcessing: boolean) => {
                set({ isProcessing });
            },

            // UI controls
            togglePanel: () => {
                set((state) => ({ isPanelOpen: !state.isPanelOpen }));
            },

            minimizePanel: () => {
                set({ isPanelMinimized: true });
            },

            maximizePanel: () => {
                set({ isPanelMinimized: false });
            },

            toggleAlbumExpanded: (albumId: string) => {
                set((state) => {
                    const newExpanded = new Set(state.expandedAlbums);
                    if (newExpanded.has(albumId)) {
                        newExpanded.delete(albumId);
                    } else {
                        newExpanded.add(albumId);
                    }
                    return { expandedAlbums: newExpanded };
                });
            },

            // Restore pending tasks from IndexedDB
            restoreFromDB: async () => {
                if (!uploadDb.isIndexedDBSupported()) return;

                try {
                    const pendingTasks = await uploadDb.getAllPendingTasks();

                    if (pendingTasks.length === 0) return;

                    const restoredTasks: UploadTask[] = pendingTasks.map((task) => ({
                        id: task.taskId,
                        albumId: task.albumId,
                        albumTitle: task.albumTitle,
                        fileName: task.fileName,
                        fileSize: task.fileSize,
                        mimeType: task.mimeType,
                        status: task.status === 'uploading' ? 'pending' : task.status, // Reset uploading to pending
                        progress: 0, // Reset progress
                        error: task.error,
                        retryCount: task.retryCount,
                        createdAt: task.createdAt,
                    }));

                    set((state) => ({
                        tasks: [...state.tasks, ...restoredTasks],
                        isPanelOpen: restoredTasks.length > 0,
                    }));
                } catch (error) {
                    console.error('Failed to restore tasks from IndexedDB:', error);
                }
            },

            // Get tasks for a specific album
            getTasksByAlbum: (albumId: string) => {
                return get().tasks.filter((task) => task.albumId === albumId);
            },

            // Get album groups for UI display
            getAlbumGroups: () => {
                const { tasks, expandedAlbums } = get();
                const groupMap = new Map<string, AlbumUploadGroup>();

                tasks.forEach((task) => {
                    if (!groupMap.has(task.albumId)) {
                        groupMap.set(task.albumId, {
                            albumId: task.albumId,
                            albumTitle: task.albumTitle,
                            tasks: [],
                            totalFiles: 0,
                            completedFiles: 0,
                            failedFiles: 0,
                            isExpanded: expandedAlbums.has(task.albumId),
                        });
                    }

                    const group = groupMap.get(task.albumId)!;
                    group.tasks.push(task);
                    group.totalFiles++;
                    if (task.status === 'success') group.completedFiles++;
                    if (task.status === 'error') group.failedFiles++;
                });

                return Array.from(groupMap.values()).sort(
                    (a, b) => b.tasks[0]?.createdAt - a.tasks[0]?.createdAt
                );
            },

            // Get pending tasks
            getPendingTasks: () => {
                return get().tasks.filter(
                    (task) => task.status === 'pending' || task.status === 'uploading'
                );
            },

            // Get count of active (non-completed) uploads
            getActiveCount: () => {
                return get().tasks.filter(
                    (task) => task.status !== 'success' && task.status !== 'cancelled'
                ).length;
            },

            // Get total progress percentage
            getTotalProgress: () => {
                const tasks = get().tasks.filter(
                    (task) => task.status !== 'cancelled'
                );
                if (tasks.length === 0) return 0;

                const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
                return Math.round(totalProgress / tasks.length);
            },
        }),
        {
            name: 'upload-store',
            partialize: (state) => ({
                // Only persist UI preferences, not actual tasks (they're in IndexedDB)
                isPanelMinimized: state.isPanelMinimized,
                expandedAlbums: Array.from(state.expandedAlbums),
            }),
            onRehydrateStorage: () => (state) => {
                // Convert expandedAlbums back to Set after rehydration
                if (state && Array.isArray(state.expandedAlbums)) {
                    state.expandedAlbums = new Set(state.expandedAlbums as unknown as string[]);
                }
            },
        }
    )
);
