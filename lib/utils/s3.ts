// AWS S3 Configuration and Helper Functions
// Install: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;
const CLOUDFRONT_URL = process.env.AWS_CLOUDFRONT_URL; // Optional CDN

export interface UploadResult {
  s3Key: string;
  s3Url: string;
  cdnUrl?: string;
}

/**
 * Generate a unique S3 key for a file
 */
export function generateS3Key(photographerId: string, albumId: string, filename: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = filename.split('.').pop();
  
  return `photos/${photographerId}/${albumId}/${timestamp}-${randomString}.${extension}`;
}

/**
 * Generate S3 key for thumbnail
 */
export function generateThumbnailKey(originalKey: string): string {
  const parts = originalKey.split('/');
  const filename = parts[parts.length - 1];
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
  const extension = filename.split('.').pop();
  
  parts[parts.length - 1] = `${nameWithoutExt}_thumb.${extension}`;
  return parts.join('/');
}

/**
 * Upload file to S3
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  mimeType: string,
  metadata?: Record<string, string>
): Promise<UploadResult> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: metadata,
      // ACL: 'public-read', // Use only if bucket allows public access
    });

    await s3Client.send(command);

    const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    const cdnUrl = CLOUDFRONT_URL ? `${CLOUDFRONT_URL}/${key}` : undefined;

    return {
      s3Key: key,
      s3Url,
      cdnUrl,
    };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error('Failed to upload file to S3');
  }
}

/**
 * Delete file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('S3 Delete Error:', error);
    throw new Error('Failed to delete file from S3');
  }
}

/**
 * Delete multiple files from S3
 */
export async function deleteMultipleFromS3(keys: string[]): Promise<void> {
  try {
    await Promise.all(keys.map((key) => deleteFromS3(key)));
  } catch (error) {
    console.error('S3 Multiple Delete Error:', error);
    throw new Error('Failed to delete files from S3');
  }
}

/**
 * Generate a pre-signed URL for secure file upload from client
 */
export async function generatePresignedUploadUrl(
  key: string,
  mimeType: string,
  expiresIn: number = 300 // 5 minutes
): Promise<{ uploadUrl: string; key: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return {
      uploadUrl,
      key,
    };
  } catch (error) {
    console.error('Pre-signed URL Generation Error:', error);
    throw new Error('Failed to generate pre-signed URL');
  }
}

/**
 * Generate a pre-signed URL for secure file download
 */
export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return downloadUrl;
  } catch (error) {
    console.error('Pre-signed Download URL Error:', error);
    throw new Error('Failed to generate pre-signed download URL');
  }
}

/**
 * Get public URL for a file (if bucket is public)
 */
export function getPublicUrl(key: string): string {
  if (CLOUDFRONT_URL) {
    return `${CLOUDFRONT_URL}/${key}`;
  }
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
}

export default s3Client;
