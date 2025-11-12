# AWS S3 Quick Setup Checklist

Complete these steps to set up AWS S3 for your photography album project.

## ☐ Step 1: AWS Account Setup (5 minutes)
- [ ] Create AWS account at https://aws.amazon.com (if you don't have one)
- [ ] Verify email and phone number
- [ ] Add payment method (Free tier available)

## ☐ Step 2: Create S3 Bucket (5 minutes)
1. Login to AWS Console: https://console.aws.amazon.com
2. Search for "S3" and open service
3. Click "Create bucket"
4. Enter details:
   - **Bucket name**: `my-photography-app-photos` (must be unique globally)
   - **Region**: `us-east-1` (or closest to your users)
5. Settings:
   - [ ] **Block all public access**: ✅ CHECKED (keep it secure)
   - [ ] **Bucket Versioning**: Optional (recommended)
   - [ ] **Server-side encryption**: ✅ Enable with SSE-S3
6. Click "Create bucket"

## ☐ Step 3: Configure CORS (3 minutes)
1. Open your S3 bucket
2. Go to "Permissions" tab
3. Scroll to "Cross-origin resource sharing (CORS)"
4. Click "Edit" and paste:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["http://localhost:3000"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

5. Click "Save changes"

## ☐ Step 4: Create IAM User (5 minutes)
1. Search for "IAM" in AWS Console
2. Click "Users" → "Add users"
3. User details:
   - **User name**: `photography-app-user`
   - **Access type**: ✅ Access key - Programmatic access
4. Click "Next: Permissions"
5. Select "Attach existing policies directly"
6. Search and select: **AmazonS3FullAccess**
7. Click "Next" → "Next" → "Create user"
8. **⚠️ IMPORTANT**: Copy and save these credentials NOW:
   ```
   Access key ID: AKIAIOSFODNN7EXAMPLE
   Secret access key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   ```
   You cannot view the secret key again!

## ☐ Step 5: Configure Environment Variables (2 minutes)
1. Copy example file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your values:
   ```env
   # MongoDB (you should already have this)
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/photography-app

   # JWT (you should already have this)
   JWT_SECRET=your-jwt-secret-key

   # AWS S3 (add these new values)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=PASTE_YOUR_ACCESS_KEY_HERE
   AWS_SECRET_ACCESS_KEY=PASTE_YOUR_SECRET_KEY_HERE
   AWS_S3_BUCKET_NAME=my-photography-app-photos
   ```

3. Save the file

## ☐ Step 6: Install AWS SDK (1 minute)
Already installed! ✅

If you need to reinstall:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## ☐ Step 7: Test Your Setup (2 minutes)

Create `test-s3.js` in your project root:

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
    console.log('Testing S3 connection...');
    console.log('Bucket:', process.env.AWS_S3_BUCKET_NAME);
    console.log('Region:', process.env.AWS_REGION);

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: 'test/hello.txt',
      Body: 'Hello from Photography App! S3 is working!',
      ContentType: 'text/plain',
    });

    await s3Client.send(command);
    console.log('✅ SUCCESS! S3 upload is working!');
    console.log(`Test file uploaded to: ${process.env.AWS_S3_BUCKET_NAME}/test/hello.txt`);
  } catch (error) {
    console.error('❌ FAILED! S3 upload error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your AWS credentials in .env.local');
    console.error('2. Verify bucket name is correct');
    console.error('3. Ensure IAM user has S3 permissions');
  }
}

testUpload();
```

Run the test:
```bash
node test-s3.js
```

Expected output:
```
Testing S3 connection...
Bucket: my-photography-app-photos
Region: us-east-1
✅ SUCCESS! S3 upload is working!
Test file uploaded to: my-photography-app-photos/test/hello.txt
```

## ☐ Step 8: Verify in AWS Console (1 minute)
1. Go back to S3 in AWS Console
2. Open your bucket
3. You should see a `test/` folder with `hello.txt` file
4. If you see it, everything is working! 🎉

## ☐ Step 9: Start Development Server (1 minute)
```bash
npm run dev
```

Your app is now ready to upload photos to S3! 🚀

---

## Quick Troubleshooting

### ❌ Error: "Access Denied"
**Solution**: 
- Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in `.env.local`
- Verify IAM user has AmazonS3FullAccess policy

### ❌ Error: "No such bucket"
**Solution**: 
- Verify AWS_S3_BUCKET_NAME matches your actual bucket name
- Check you're using the correct AWS_REGION

### ❌ Error: "CORS policy error" (in browser)
**Solution**: 
- Go to S3 bucket → Permissions → CORS
- Make sure CORS configuration includes your domain

### ❌ Error: "Credentials not found"
**Solution**: 
- Ensure `.env.local` file exists
- Restart your development server after adding env variables

---

## Total Setup Time: ~20-25 minutes

## What's Next?

Once setup is complete, you can:
- ✅ Upload photos from your app
- ✅ Create albums with photo storage
- ✅ Share albums with clients
- ✅ Download photos securely
- ✅ Manage photo permissions

---

## Optional: CloudFront CDN Setup

For faster global photo delivery, see the full AWS_SETUP_GUIDE.md for CloudFront setup instructions.

---

## Need Help?

- **Detailed Setup**: See `AWS_SETUP_GUIDE.md`
- **API Documentation**: See `API_DOCUMENTATION.md`
- **AWS Free Tier**: https://aws.amazon.com/free/
- **AWS Support**: https://console.aws.amazon.com/support/

---

**You're all set! Happy coding! 🎨📸**
