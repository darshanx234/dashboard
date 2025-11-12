# AWS S3 Setup Guide for Photography Album Project

This guide will walk you through setting up AWS S3 for storing photos in your photography album management system.

---

## Prerequisites

- AWS Account (create one at https://aws.amazon.com if you don't have one)
- AWS CLI installed (optional but recommended)
- Credit card for AWS account verification (AWS Free Tier available)

---

## Step 1: Create an S3 Bucket

### Option A: Using AWS Console (Web Interface)

1. **Login to AWS Console**
   - Go to https://console.aws.amazon.com
   - Sign in with your AWS account

2. **Navigate to S3**
   - Search for "S3" in the top search bar
   - Click on "S3" service

3. **Create Bucket**
   - Click "Create bucket" button
   - Enter bucket details:
     - **Bucket name**: `your-photography-bucket` (must be globally unique)
     - **AWS Region**: Choose closest to your users (e.g., `us-east-1`)
   
4. **Configure Bucket Settings**
   
   **Object Ownership:**
   - Select "ACLs disabled (recommended)"
   
   **Block Public Access:**
   - ✅ Keep "Block all public access" CHECKED (we'll use pre-signed URLs)
   - This is more secure for private photo storage
   
   **Bucket Versioning:**
   - Enable if you want to keep old versions of photos (optional)
   
   **Default Encryption:**
   - ✅ Enable "Server-side encryption"
   - Choose "Amazon S3 managed keys (SSE-S3)"
   
5. **Click "Create bucket"**

### Option B: Using AWS CLI

```bash
# Install AWS CLI first: https://aws.amazon.com/cli/

# Configure AWS CLI
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter default region (e.g., us-east-1)
# Enter default output format (json)

# Create bucket
aws s3api create-bucket \
  --bucket your-photography-bucket \
  --region us-east-1

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket your-photography-bucket \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

---

## Step 2: Configure CORS for S3 Bucket

CORS (Cross-Origin Resource Sharing) allows your Next.js app to upload files directly to S3.

### Using AWS Console:

1. Go to your S3 bucket
2. Click on "Permissions" tab
3. Scroll down to "Cross-origin resource sharing (CORS)"
4. Click "Edit" and paste this configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "https://yourdomain.com"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-id-2"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

5. Click "Save changes"

### Using AWS CLI:

Create a file `cors.json`:
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

Apply CORS configuration:
```bash
aws s3api put-bucket-cors \
  --bucket your-photography-bucket \
  --cors-configuration file://cors.json
```

---

## Step 3: Create IAM User for Programmatic Access

### Using AWS Console:

1. **Navigate to IAM**
   - Search for "IAM" in AWS Console
   - Click on "IAM" service

2. **Create New User**
   - Click "Users" in left sidebar
   - Click "Add users" button
   - User name: `photography-app-user`
   - Select "Access key - Programmatic access"
   - Click "Next: Permissions"

3. **Set Permissions**
   - Click "Attach existing policies directly"
   - Search and select: `AmazonS3FullAccess` (for development)
   - OR create custom policy (recommended for production)
   - Click "Next: Tags" → "Next: Review" → "Create user"

4. **Save Credentials**
   - ⚠️ **IMPORTANT**: Copy and save these credentials immediately
   - **Access key ID**: `AKIAIOSFODNN7EXAMPLE`
   - **Secret access key**: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
   - You won't be able to see the secret key again!

### Custom IAM Policy (Recommended for Production):

Instead of `AmazonS3FullAccess`, create a custom policy with minimum permissions:

1. In IAM Users page, click your user
2. Click "Add inline policy"
3. Click "JSON" tab
4. Paste this policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ListBucket",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::your-photography-bucket"
        },
        {
            "Sid": "ManageObjects",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:PutObjectAcl"
            ],
            "Resource": "arn:aws:s3:::your-photography-bucket/*"
        }
    ]
}
```

5. Review and create policy

---

## Step 4: Configure Environment Variables

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` with your AWS credentials:**
   ```env
   # MongoDB Configuration
   MONGODB_URI=your-mongodb-connection-string

   # JWT Authentication
   JWT_SECRET=your-super-secret-jwt-key

   # AWS S3 Configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   AWS_S3_BUCKET_NAME=your-photography-bucket

   # Optional: CloudFront CDN (see Step 6)
   # AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
   ```

3. **Add `.env.local` to `.gitignore` (should already be there):**
   ```gitignore
   .env.local
   .env
   ```

---

## Step 5: Test S3 Upload

Create a test script to verify your S3 setup:

**Create `test-s3.js` in project root:**
```javascript
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
```

**Run the test:**
```bash
node test-s3.js
```

---

## Step 6: (Optional) Setup CloudFront CDN

CloudFront is AWS's CDN that caches and delivers your photos faster globally.

### Why use CloudFront?
- Faster image delivery worldwide
- Reduced S3 costs (CloudFront is cheaper for high traffic)
- Custom domain support (photos.yourdomain.com)
- HTTPS by default

### Setup Steps:

1. **Navigate to CloudFront in AWS Console**

2. **Create Distribution**
   - Click "Create distribution"
   - Origin domain: Select your S3 bucket
   - Origin access: "Legacy access identities"
   - Create new OAI and grant S3 bucket permissions
   - Viewer protocol policy: "Redirect HTTP to HTTPS"
   - Allowed HTTP methods: "GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE"
   - Cache policy: "CachingOptimized"
   - Click "Create distribution"

3. **Wait for Deployment** (10-15 minutes)
   - Status will change from "In Progress" to "Deployed"

4. **Copy Distribution Domain Name**
   - Example: `d1234567890.cloudfront.net`

5. **Add to `.env.local`:**
   ```env
   AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
   ```

6. **Update S3 Bucket Policy** (if using OAI):
   - CloudFront will automatically update S3 permissions
   - This allows CloudFront to access private S3 objects

---

## Step 7: Folder Structure in S3

Your photos will be organized in S3 like this:

```
your-photography-bucket/
├── photos/
│   ├── {photographerId}/
│   │   ├── {albumId}/
│   │   │   ├── 1699123456789-abc123.jpg
│   │   │   ├── 1699123456789-abc123_thumb.jpg
│   │   │   ├── 1699123457890-def456.jpg
│   │   │   └── 1699123457890-def456_thumb.jpg
│   │   └── another-album-id/
│   └── another-photographer-id/
```

This structure:
- Isolates each photographer's photos
- Organizes by album
- Uses timestamps + random strings for unique filenames
- Stores thumbnails with `_thumb` suffix

---

## Step 8: Security Best Practices

### ✅ DO:
- Use IAM roles with minimum required permissions
- Keep AWS credentials in `.env.local` (never commit to git)
- Use pre-signed URLs for uploads (client → S3 direct)
- Enable S3 bucket encryption
- Block public access and use pre-signed URLs for downloads
- Set expiration on pre-signed URLs (5-60 minutes)
- Enable CloudTrail for audit logs

### ❌ DON'T:
- Never expose AWS credentials in client-side code
- Don't make S3 bucket publicly accessible
- Don't use root AWS account credentials
- Don't commit `.env` files to version control
- Don't give users permanent S3 access

---

## Step 9: Cost Estimation

### AWS Free Tier (First 12 months):
- **S3 Storage**: 5 GB free
- **S3 Requests**: 20,000 GET requests, 2,000 PUT requests
- **CloudFront**: 1 TB data transfer out

### After Free Tier (Approximate costs):
- **S3 Storage**: ~$0.023 per GB/month
- **S3 PUT requests**: $0.005 per 1,000 requests
- **S3 GET requests**: $0.0004 per 1,000 requests
- **Data Transfer Out**: $0.09 per GB (first 10 TB)
- **CloudFront**: ~$0.085 per GB (first 10 TB)

**Example**: 100 GB storage + 10,000 photo views/month ≈ $3-5/month

---

## Step 10: Monitoring

### Set up CloudWatch Alarms:

1. **Storage Monitoring:**
   - Go to CloudWatch → Alarms
   - Create alarm for S3 bucket size
   - Set threshold (e.g., alert at 80% of budget)

2. **Cost Alerts:**
   - Go to AWS Billing → Budgets
   - Create budget alert
   - Get email when costs exceed threshold

---

## Troubleshooting

### Error: "Access Denied"
- Check IAM user has correct permissions
- Verify AWS credentials in `.env.local`
- Ensure bucket name is correct

### Error: "CORS policy error"
- Verify CORS configuration in S3 bucket
- Check allowed origins match your domain
- Clear browser cache and try again

### Error: "Bucket not found"
- Verify bucket name spelling
- Check you're using correct AWS region
- Ensure bucket exists in your AWS account

### Upload is slow
- Consider using CloudFront CDN
- Check your internet connection
- Use S3 Transfer Acceleration (additional cost)

---

## Next Steps

1. ✅ Create S3 bucket
2. ✅ Set up IAM user with credentials
3. ✅ Configure CORS
4. ✅ Add credentials to `.env.local`
5. ✅ Test upload with `test-s3.js`
6. ✅ (Optional) Setup CloudFront
7. ✅ Start development!

---

## Useful AWS Resources

- [S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
- [S3 Pricing Calculator](https://calculator.aws/)
- [AWS Free Tier Details](https://aws.amazon.com/free/)

---

## Support

If you encounter issues:
1. Check AWS CloudWatch logs
2. Review S3 bucket permissions
3. Verify IAM user permissions
4. Check CORS configuration
5. Test with AWS CLI first

---

**Your S3 setup is now complete! 🎉**

The application will automatically:
- Generate pre-signed URLs for secure uploads
- Store photos in organized folder structure
- Handle thumbnails and metadata
- Track downloads and views
- Manage access permissions
