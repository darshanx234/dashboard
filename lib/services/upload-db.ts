import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema
interface UploadDB extends DBSchema {
    files: {
        key: string; // taskId
        value: {
            taskId: string;
            albumId: string;
            albumTitle: string;
            file: File;
            createdAt: number;
        };
        indexes: { 'by-album': string };
    };
    tasks: {
        key: string; // taskId
        value: {
            taskId: string;
            albumId: string;
            albumTitle: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
            status: 'pending' | 'uploading' | 'paused' | 'error';
            progress: number;
            error?: string;
            retryCount: number;
            createdAt: number;
        };
        indexes: { 'by-album': string; 'by-status': string };
    };
}

const DB_NAME = 'upload-queue-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<UploadDB> | null = null;

/**
 * Get or create database instance
 */
async function getDB(): Promise<IDBPDatabase<UploadDB>> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<UploadDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Files store - stores actual File objects
            if (!db.objectStoreNames.contains('files')) {
                const fileStore = db.createObjectStore('files', { keyPath: 'taskId' });
                fileStore.createIndex('by-album', 'albumId');
            }

            // Tasks store - stores task metadata
            if (!db.objectStoreNames.contains('tasks')) {
                const taskStore = db.createObjectStore('tasks', { keyPath: 'taskId' });
                taskStore.createIndex('by-album', 'albumId');
                taskStore.createIndex('by-status', 'status');
            }
        },
    });

    return dbInstance;
}

/**
 * Save file and task metadata to IndexedDB
 */
export async function saveUploadTask(
    taskId: string,
    file: File,
    albumId: string,
    albumTitle: string
): Promise<void> {
    const db = await getDB();
    const now = Date.now();

    // Save file
    await db.put('files', {
        taskId,
        albumId,
        albumTitle,
        file,
        createdAt: now,
    });

    // Save task metadata
    await db.put('tasks', {
        taskId,
        albumId,
        albumTitle,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        status: 'pending',
        progress: 0,
        retryCount: 0,
        createdAt: now,
    });
}

/**
 * Get file by taskId
 */
export async function getFile(taskId: string): Promise<File | null> {
    const db = await getDB();
    const record = await db.get('files', taskId);
    return record?.file || null;
}

/**
 * Update task status in IndexedDB
 */
export async function updateTaskStatus(
    taskId: string,
    status: 'pending' | 'uploading' | 'paused' | 'error',
    progress?: number,
    error?: string
): Promise<void> {
    const db = await getDB();
    const task = await db.get('tasks', taskId);

    if (task) {
        task.status = status;
        if (progress !== undefined) task.progress = progress;
        if (error !== undefined) task.error = error;
        if (status === 'error') task.retryCount++;
        await db.put('tasks', task);
    }
}

/**
 * Delete file and task from IndexedDB (after successful upload)
 */
export async function deleteUploadTask(taskId: string): Promise<void> {
    const db = await getDB();
    await db.delete('files', taskId);
    await db.delete('tasks', taskId);
}

/**
 * Get all pending/paused/error tasks for resume
 */
export async function getAllPendingTasks(): Promise<{
    taskId: string;
    albumId: string;
    albumTitle: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    status: 'pending' | 'uploading' | 'paused' | 'error';
    progress: number;
    error?: string;
    retryCount: number;
    createdAt: number;
}[]> {
    const db = await getDB();
    const allTasks = await db.getAll('tasks');

    // Return tasks that are not completed
    return allTasks.filter(
        (task) => task.status !== 'pending' || task.status === 'pending'
    );
}

/**
 * Get tasks by album
 */
export async function getTasksByAlbum(albumId: string): Promise<{
    taskId: string;
    fileName: string;
    fileSize: number;
    status: string;
    progress: number;
}[]> {
    const db = await getDB();
    return db.getAllFromIndex('tasks', 'by-album', albumId);
}

/**
 * Clear all completed tasks (cleanup)
 */
export async function clearCompletedTasks(): Promise<void> {
    const db = await getDB();
    const allTasks = await db.getAll('tasks');

    for (const task of allTasks) {
        // Only keep pending, uploading, paused, error tasks
        // This function is mainly for cleanup after successful uploads
    }
}

/**
 * Clear all tasks for an album
 */
export async function clearAlbumTasks(albumId: string): Promise<void> {
    const db = await getDB();

    // Get all files for this album
    const files = await db.getAllFromIndex('files', 'by-album', albumId);
    const tasks = await db.getAllFromIndex('tasks', 'by-album', albumId);

    // Delete files
    for (const file of files) {
        await db.delete('files', file.taskId);
    }

    // Delete tasks
    for (const task of tasks) {
        await db.delete('tasks', task.taskId);
    }
}

/**
 * Check if IndexedDB is supported
 */
export function isIndexedDBSupported(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
}
