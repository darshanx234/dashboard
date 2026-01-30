import { uploadApi, photoApi, type Photo } from '@/lib/api/albums';
import { useUploadStore, UploadTask } from '@/lib/store/upload';
import * as uploadDb from '@/lib/services/upload-db';
import SparkMD5 from 'spark-md5';

// S3 constants
const S3_BUCKET = 'shotsspace';
const S3_REGION = 'us-east-1';

/**
 * Global Upload Manager - Singleton
 * Manages the upload queue and processes uploads in background
 */
class GlobalUploadManager {
    private static instance: GlobalUploadManager | null = null;
    private activeUploads: Map<string, AbortController> = new Map();
    private maxConcurrent: number = 3;
    private maxRetries: number = 3;
    private isRunning: boolean = false;
    private processingPromise: Promise<void> | null = null;

    private constructor() {
        // Initialize on app load
        if (typeof window !== 'undefined') {
            this.restoreAndResume();
        }
    }

    /**
     * Get singleton instance
     */
    static getInstance(): GlobalUploadManager {
        if (!GlobalUploadManager.instance) {
            GlobalUploadManager.instance = new GlobalUploadManager();
        }
        return GlobalUploadManager.instance;
    }

    /**
     * Restore pending uploads from IndexedDB and resume
     */
    private async restoreAndResume(): Promise<void> {
        const store = useUploadStore.getState();
        await store.restoreFromDB();

        // Auto-start if there are pending tasks
        const pending = store.getPendingTasks();
        if (pending.length > 0) {
            this.startProcessing();
        }
    }

    /**
     * Add files to upload queue
     */
    async addFiles(files: File[], albumId: string, albumTitle: string): Promise<string[]> {
        const store = useUploadStore.getState();
        const taskIds = await store.addTasks(files, albumId, albumTitle);

        // Start processing if not already running
        this.startProcessing();

        return taskIds;
    }

    /**
     * Start processing the upload queue
     */
    startProcessing(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        useUploadStore.getState().setProcessing(true);
        this.processingPromise = this.processQueue();
    }

    /**
     * Process the upload queue
     */
    private async processQueue(): Promise<void> {
        const store = useUploadStore.getState();

        while (true) {
            // Get pending tasks from store
            const pending = store.getPendingTasks().filter(t => t.status === 'pending');

            // Check if we're done
            if (pending.length === 0 && this.activeUploads.size === 0) {
                break;
            }

            // If no pending but active uploads, wait
            if (pending.length === 0) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                continue;
            }

            // Calculate available slots
            const availableSlots = this.maxConcurrent - this.activeUploads.size;
            if (availableSlots <= 0) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                continue;
            }

            // Start uploads for available slots
            const batch = pending.slice(0, availableSlots);
            batch.forEach((task) => this.uploadTask(task));

            // Small delay
            await new Promise((resolve) => setTimeout(resolve, 50));
        }

        this.isRunning = false;
        useUploadStore.getState().setProcessing(false);
    }

    /**
     * Upload a single task
     */
    private async uploadTask(task: UploadTask): Promise<void> {
        const store = useUploadStore.getState();
        const abortController = new AbortController();
        this.activeUploads.set(task.id, abortController);

        try {
            // Update status to uploading
            store.updateTaskStatus(task.id, 'uploading');

            // Get file from IndexedDB
            const file = await uploadDb.getFile(task.id);
            if (!file) {
                throw new Error('File not found in storage');
            }

            // Step 1: Get pre-signed URL (10%)
            store.updateTaskProgress(task.id, 10);
            const { uploadUrl, s3Key } = await uploadApi.getPresignedUrl({
                albumId: task.albumId,
                filename: file.name,
                mimeType: file.type,
                fileSize: file.size,
            });

            if (abortController.signal.aborted) {
                throw new Error('Upload cancelled');
            }

            // Step 2: Upload to S3 (30%)
            store.updateTaskProgress(task.id, 30);
            await uploadApi.uploadToS3(uploadUrl, file, abortController.signal);

            if (abortController.signal.aborted) {
                throw new Error('Upload cancelled');
            }

            // Step 3: Get image dimensions (70%)
            store.updateTaskProgress(task.id, 70);
            let width: number | undefined;
            let height: number | undefined;

            if (file.type.startsWith('image/')) {
                try {
                    const dimensions = await this.getImageDimensions(file);
                    width = dimensions.width;
                    height = dimensions.height;
                } catch (e) {
                    console.error('Failed to get image dimensions:', e);
                }
            }

            if (abortController.signal.aborted) {
                throw new Error('Upload cancelled');
            }

            // Step 4: Create photo record (80%)
            store.updateTaskProgress(task.id, 80);
            const s3Url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;
            const md5Hash = await this.calculateMD5(file);

            const { photo } = await photoApi.createPhoto(task.albumId, {
                filename: file.name,
                originalName: file.name,
                s3Key,
                s3Url,
                fileSize: file.size,
                mimeType: file.type,
                width,
                height,
                md5Hash,
                order: 0,
            });

            // Success (100%)
            store.updateTaskProgress(task.id, 100);
            store.setTaskSuccess(task.id, photo);

        } catch (error: any) {
            if (abortController.signal.aborted || error.message === 'Upload cancelled') {
                store.updateTaskStatus(task.id, 'cancelled');
            } else {
                // Check retry count
                const currentTask = store.tasks.find(t => t.id === task.id);
                if (currentTask && currentTask.retryCount < this.maxRetries) {
                    // Will retry - set back to pending
                    store.updateTaskStatus(task.id, 'pending');
                    console.log(`Retrying upload for ${task.fileName} (attempt ${currentTask.retryCount + 1})`);
                } else {
                    store.updateTaskStatus(task.id, 'error', error.message || 'Upload failed');
                }
            }
        } finally {
            this.activeUploads.delete(task.id);
        }
    }

    /**
     * Cancel a specific upload
     */
    cancelUpload(taskId: string): void {
        const controller = this.activeUploads.get(taskId);
        if (controller) {
            controller.abort();
        }
        useUploadStore.getState().cancelTask(taskId);
    }

    /**
     * Cancel all uploads for an album
     */
    cancelAlbumUploads(albumId: string): void {
        const store = useUploadStore.getState();
        const albumTasks = store.getTasksByAlbum(albumId);

        albumTasks.forEach((task) => {
            const controller = this.activeUploads.get(task.id);
            if (controller) {
                controller.abort();
            }
        });

        store.cancelAlbumTasks(albumId);
    }

    /**
     * Cancel all uploads
     */
    cancelAll(): void {
        this.activeUploads.forEach((controller) => controller.abort());
        this.activeUploads.clear();
        useUploadStore.getState().clearAll();
        this.isRunning = false;
    }

    /**
     * Retry failed uploads
     */
    retryFailed(albumId?: string): void {
        const store = useUploadStore.getState();

        if (albumId) {
            store.retryAlbumTasks(albumId);
        } else {
            // Retry all failed
            store.tasks
                .filter((t) => t.status === 'error')
                .forEach((t) => store.retryTask(t.id));
        }

        if (!this.isRunning) {
            this.startProcessing();
        }
    }

    /**
     * Get image dimensions
     */
    private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
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

    /**
     * Calculate MD5 hash
     */
    private calculateMD5(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const buffer = e.target?.result as ArrayBuffer;
                const hash = SparkMD5.ArrayBuffer.hash(buffer);
                resolve(hash);
            };

            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Get queue status
     */
    getStatus() {
        const store = useUploadStore.getState();
        return {
            isRunning: this.isRunning,
            activeUploads: this.activeUploads.size,
            totalTasks: store.tasks.length,
            pending: store.tasks.filter((t) => t.status === 'pending').length,
            uploading: store.tasks.filter((t) => t.status === 'uploading').length,
            success: store.tasks.filter((t) => t.status === 'success').length,
            error: store.tasks.filter((t) => t.status === 'error').length,
        };
    }
}

// Export singleton getter
export const getUploadManager = () => GlobalUploadManager.getInstance();

// Export for convenience
export { GlobalUploadManager };
