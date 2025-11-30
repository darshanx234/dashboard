import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import { generatePresignedUploadUrl, generateS3Key } from '@/lib/utils/s3';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/upload/presigned - Generate pre-signed URL for S3 upload
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const body = await request.json();

    await connectDB();

    const {
      albumId,
      filename,
      mimeType,
      fileSize,
    } = body;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic' , 'image/avif'];
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (e.g., max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (fileSize > maxSize) {
      return NextResponse.json({ error: 'File size exceeds limit' }, { status: 400 });
    }

    // Generate S3 key
    const s3Key = generateS3Key(decoded.userId, albumId, filename);

    // Generate pre-signed URL
    const { uploadUrl } = await generatePresignedUploadUrl(s3Key, mimeType, 300);

    return NextResponse.json({
      uploadUrl,
      s3Key,
      expiresIn: 300, // 5 minutes
    });
  } catch (error: any) {
    console.error('Generate Presigned URL Error:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
