const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testUpload() {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: 'test/test-file.txt',
      Body: 'Hello from photography app!',
      ContentType: 'text/plain',
    });

    await s3Client.send(command);
    console.log('✅ S3 upload successful!');
    console.log(`File uploaded to: ${process.env.AWS_S3_BUCKET_NAME}/test/test-file.txt`);
  } catch (error) {
    console.error('❌ S3 upload failed:', error.message);
  }
}

testUpload();