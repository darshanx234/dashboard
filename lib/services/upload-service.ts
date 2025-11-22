import { uploadApi, photoApi, type Photo } from '@/lib/api/albums';

// S3 constants
const S3_BUCKET = 'photoalumnus';
const S3_REGION = 'ap-south-1';

export interface UploadTask {
    id: string;
    file: File;
    albumId: string;
    status: 'pending' | 'uploading' | 'success' | 'error' | 'cancelled';
    progress: number;
    error?: string;
    retryCount: number;
    abortController?: AbortController;
    photo?: Photo;
}

export interface UploadCallbacks {
    onProgress: (taskId: string, progress: number) => void;
    onSuccess: (taskId: string, photo: Photo) => void;
    onError: (taskId: string, error: string) => void;
    onStatusChange: (taskId: string, status: UploadTask['status']) => void;
    onComplete: () => void;
}

export class UploadService {
    private uploadQueue: UploadTask[] = [];
    private activeUploads: Map<string, AbortController> = new Map();
    private maxConcurrent: number = 3;
    private maxRetries: number = 3;
    private callbacks: UploadCallbacks;
    private isRunning: boolean = false;

    constructor(callbacks: UploadCallbacks) {
        this.callbacks = callbacks;
    }

    /**
     * Add files to the upload queue
     */
    addToQueue(files: File[], albumId: string): string[] {
        const taskIds: string[] = [];

        files.forEach((file) => {
            const taskId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const task: UploadTask = {
                id: taskId,
                file,
                albumId,
                status: 'pending',
                progress: 0,
                retryCount: 0,
            };

            this.uploadQueue.push(task);
            taskIds.push(taskId);
        });

        return taskIds;
    }

    /**
     * Start processing the upload queue
     */
    async startUploads(): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;

        while (true) {
            // Get pending tasks
            const pending = this.uploadQueue.filter((t) => t.status === 'pending');

            // Check if we're done (no pending tasks and no active uploads)
            if (pending.length === 0 && this.activeUploads.size === 0) {
                break; // All done
            }

            // If no pending tasks but there are active uploads, wait for them
            if (pending.length === 0) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                continue;
            }

            // Calculate how many new uploads we can start
            const availableSlots = this.maxConcurrent - this.activeUploads.size;
            if (availableSlots <= 0) {
                // Wait for a slot to open up
                await new Promise((resolve) => setTimeout(resolve, 100));
                continue;
            }

            // Start uploads for available slots
            const batch = pending.slice(0, availableSlots);
            batch.forEach((task) => this.uploadTask(task));

            // Small delay to prevent tight loop
            await new Promise((resolve) => setTimeout(resolve, 50));
        }

        this.isRunning = false;
        this.callbacks.onComplete();
    }

    /**
     * Upload a single task
     */
    private async uploadTask(task: UploadTask): Promise<void> {
        const abortController = new AbortController();
        task.abortController = abortController;
        this.activeUploads.set(task.id, abortController);

        try {
            task.status = 'uploading';
            this.callbacks.onStatusChange(task.id, 'uploading');    

            // Step 1: Get pre-signed URL (10%)
            this.updateProgress(task, 10);
            const { uploadUrl, s3Key } = await uploadApi.getPresignedUrl({
                albumId: task.albumId,
                filename: task.file.name,
                mimeType: task.file.type,
                fileSize: task.file.size,
            });

            // Check if cancelled
            if (abortController.signal.aborted) {
                throw new Error('Upload cancelled');
            }

            // Step 2: Upload to S3 (30%)
            this.updateProgress(task, 30);
            await uploadApi.uploadToS3(uploadUrl, task.file, abortController.signal);

            // Check if cancelled
            if (abortController.signal.aborted) {
                throw new Error('Upload cancelled');
            }

            // Step 3: Get image dimensions (70%)
            this.updateProgress(task, 70);
            let width: number | undefined;
            let height: number | undefined;

            if (task.file.type.startsWith('image/')) {
                try {
                    const dimensions = await this.getImageDimensions(task.file);
                    width = dimensions.width;
                    height = dimensions.height;
                } catch (e) {
                    console.error('Failed to get image dimensions:', e);
                }
            }

            // Check if cancelled
            if (abortController.signal.aborted) {
                throw new Error('Upload cancelled');
            }

            // Step 4: Create photo record (80%)
            this.updateProgress(task, 80);
            const s3Url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;

            const { photo } = await photoApi.createPhoto(task.albumId, {
                filename: task.file.name,
                originalName: task.file.name,
                s3Key,
                s3Url,
                fileSize: task.file.size,
                mimeType: task.file.type,
                width,
                height,
                order: 0, // Will be set by backend
            });

            // Success (100%)
            this.updateProgress(task, 100);
            task.status = 'success';
            task.photo = photo;
            this.callbacks.onStatusChange(task.id, 'success');
            this.callbacks.onSuccess(task.id, photo);

            // Remove from queue
            this.removeFromQueue(task.id);
        } catch (error: any) {
            // Handle cancellation
            if (abortController.signal.aborted || error.message === 'Upload cancelled') {
                task.status = 'cancelled';
                this.callbacks.onStatusChange(task.id, 'cancelled');
                this.removeFromQueue(task.id);
                return;
            }

            // Handle retry
            task.retryCount++;
            if (task.retryCount < this.maxRetries) {
                // Reset for retry
                task.status = 'pending';
                task.progress = 0;
                this.callbacks.onStatusChange(task.id, 'pending');
                console.log(`Retrying upload for ${task.file.name} (attempt ${task.retryCount + 1})`);
            } else {
                // Max retries reached
                task.status = 'error';
                task.error = error.message || 'Upload failed';
                this.callbacks.onStatusChange(task.id, 'error');
                this.callbacks.onError(task.id, task.error);
            }
        } finally {
            this.activeUploads.delete(task.id);
        }
    }

    /**
     * Update task progress
     */
    private updateProgress(task: UploadTask, progress: number): void {
        task.progress = progress;
        this.callbacks.onProgress(task.id, progress);
    }

    /**
     * Remove task from queue
     */
    private removeFromQueue(taskId: string): void {
        const index = this.uploadQueue.findIndex((t) => t.id === taskId);
        if (index !== -1) {
            this.uploadQueue.splice(index, 1);
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

        const task = this.uploadQueue.find((t) => t.id === taskId);
        if (task) {
            task.status = 'cancelled';
            this.callbacks.onStatusChange(taskId, 'cancelled');
            this.removeFromQueue(taskId);
        }
    }

    /**
     * Cancel all uploads
     */
    cancelAll(): void {
        // Abort all active uploads
        this.activeUploads.forEach((controller) => controller.abort());
        this.activeUploads.clear();

        // Mark all tasks as cancelled
        this.uploadQueue.forEach((task) => {
            task.status = 'cancelled';
            this.callbacks.onStatusChange(task.id, 'cancelled');
        });

        // Clear queue
        this.uploadQueue = [];
        this.isRunning = false;
    }

    /**
     * Retry all failed uploads
     */
    retryFailed(): void {
        this.uploadQueue.forEach((task) => {
            if (task.status === 'error') {
                task.status = 'pending';
                task.progress = 0;
                task.retryCount = 0;
                task.error = undefined;
                this.callbacks.onStatusChange(task.id, 'pending');
            }
        });

        if (!this.isRunning) {
            this.startUploads();
        }
    }

    /**
     * Get current queue status
     */
    getQueueStatus() {
        return {
            total: this.uploadQueue.length,
            pending: this.uploadQueue.filter((t) => t.status === 'pending').length,
            uploading: this.uploadQueue.filter((t) => t.status === 'uploading').length,
            success: this.uploadQueue.filter((t) => t.status === 'success').length,
            error: this.uploadQueue.filter((t) => t.status === 'error').length,
            cancelled: this.uploadQueue.filter((t) => t.status === 'cancelled').length,
            active: this.activeUploads.size,
        };
    }

    /**
     * Get all tasks
     */
    getTasks(): UploadTask[] {
        return [...this.uploadQueue];
    }

    /**
     * Helper to get image dimensions
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
     * Clean up resources
     */
    destroy(): void {
        this.cancelAll();
        this.uploadQueue = [];
        this.activeUploads.clear();
    }
}
