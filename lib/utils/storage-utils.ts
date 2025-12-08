/**
 * Storage utility functions for converting and formatting storage sizes
 */

const GB_IN_BYTES = 1024 * 1024 * 1024; // 1 GB = 1,073,741,824 bytes
const MB_IN_BYTES = 1024 * 1024; // 1 MB = 1,048,576 bytes
const KB_IN_BYTES = 1024; // 1 KB = 1,024 bytes

/**
 * Convert gigabytes to bytes
 */
export function gbToBytes(gb: number): number {
  return Math.floor(gb * GB_IN_BYTES);
}

/**
 * Convert bytes to gigabytes
 */
export function bytesToGB(bytes: number): number {
  return bytes / GB_IN_BYTES;
}

/**
 * Convert bytes to megabytes
 */
export function bytesToMB(bytes: number): number {
  return bytes / MB_IN_BYTES;
}

/**
 * Format storage size in human-readable format
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string like "45.2 GB" or "128.5 MB"
 */
export function formatStorageSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  if (bytes >= GB_IN_BYTES) {
    return `${(bytes / GB_IN_BYTES).toFixed(decimals)} GB`;
  } else if (bytes >= MB_IN_BYTES) {
    return `${(bytes / MB_IN_BYTES).toFixed(decimals)} MB`;
  } else if (bytes >= KB_IN_BYTES) {
    return `${(bytes / KB_IN_BYTES).toFixed(decimals)} KB`;
  } else {
    return `${bytes} Bytes`;
  }
}

/**
 * Calculate storage usage percentage
 * @param used - Bytes used
 * @param limit - Total bytes limit
 * @returns Percentage (0-100)
 */
export function calculateStoragePercentage(used: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min(100, (used / limit) * 100);
}

/**
 * Get storage status color based on usage percentage
 * @param percentage - Usage percentage (0-100)
 * @returns Color indicator: 'success' | 'warning' | 'danger'
 */
export function getStorageStatusColor(percentage: number): 'success' | 'warning' | 'danger' {
  if (percentage < 70) return 'success';
  if (percentage < 90) return 'warning';
  return 'danger';
}

/**
 * Check if storage limit is exceeded
 * @param used - Current bytes used
 * @param limit - Total bytes limit
 * @param additionalBytes - Additional bytes to add (optional)
 * @returns true if limit would be exceeded
 */
export function isStorageLimitExceeded(
  used: number,
  limit: number,
  additionalBytes: number = 0
): boolean {
  return used + additionalBytes > limit;
}

/**
 * Calculate remaining storage
 * @param used - Current bytes used
 * @param limit - Total bytes limit
 * @returns Remaining bytes (0 if limit exceeded)
 */
export function getRemainingStorage(used: number, limit: number): number {
  return Math.max(0, limit - used);
}
