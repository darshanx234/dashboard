# Photography Album Management System

A comprehensive web application for photographers to manage, share, and deliver photos to clients. Built with Next.js, MongoDB, and AWS S3.

## 🎯 Features

### For Photographers
- 📸 **Album Management**: Create and organize photo albums
- ☁️ **Cloud Storage**: Store photos securely in AWS S3
- 🔗 **Smart Sharing**: Share albums via password-protected links or email invites
- 📊 **Analytics**: Track views, downloads, and favorites
- 👥 **Client Management**: Manage client access and permissions
- 🎨 **Customization**: Configure download permissions, favorites, and privacy settings

### For Clients
- 🖼️ **Gallery View**: Browse shared albums in beautiful galleries
- ⭐ **Favorites**: Mark favorite photos for easy reference
- 💾 **Downloads**: Download individual photos or entire albums
- 📱 **Responsive**: Works perfectly on desktop, tablet, and mobile
- 🔒 **Secure Access**: Password-protected album access

### For Admins
- 👨‍💼 **User Management**: Create and manage all user accounts
- 📊 **Reports**: View system-wide analytics and reports
- ⚙️ **Settings**: Configure system-wide settings
- 🗄️ **Album Management**: Access and manage all albums

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account
- AWS account with S3 access

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your credentials:
   ```env
   # MongoDB
   MONGODB_URI=your-mongodb-connection-string
   
   # JWT
   JWT_SECRET=your-secret-key
   
   # AWS S3
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_S3_BUCKET_NAME=your-bucket-name
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   ```
   http://localhost:3000
   ```

## 📚 Documentation

- **[AWS Setup Guide](./AWS_SETUP_GUIDE.md)** - Complete AWS S3 setup instructions
- **[AWS Quick Start](./AWS_QUICK_START.md)** - Quick checklist for AWS setup
- **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference
- **[Architecture](./ARCHITECTURE.md)** - System architecture and flow diagrams

## 🏗️ Tech Stack

- **Frontend**: Next.js 13.5, React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide React icons
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: JWT, bcryptjs
- **Storage**: AWS S3, CloudFront (optional)
- **State Management**: Zustand with persistence

## 📁 Project Structure

```
dashboard/
├── app/                      # Next.js app directory
│   ├── albums/              # Album management pages
│   ├── my-albums/           # Client album view
│   ├── favorites/           # Favorites page
│   ├── downloads/           # Download history
│   ├── admin/               # Admin dashboard
│   └── api/                 # API routes
│       ├── auth/            # Authentication APIs
│       ├── albums/          # Album management APIs
│       ├── upload/          # File upload APIs
│       └── shared/          # Public sharing APIs
├── components/              # React components
│   ├── auth/                # Auth forms
│   ├── layout/              # Layout components
│   └── ui/                  # shadcn/ui components
├── lib/                     # Utility libraries
│   ├── models/              # MongoDB models
│   │   ├── User.ts
│   │   ├── Album.ts
│   │   ├── Photo.ts
│   │   ├── AlbumShare.ts
│   │   ├── Favorite.ts
│   │   └── Download.ts
│   ├── s3.ts                # AWS S3 utilities
│   ├── mongodb.ts           # Database connection
│   └── sidebar-config.ts    # Role-based menus
└── docs/                    # Documentation
```

## 🔐 User Roles

### Photographer (Default)
- Create and manage own albums
- Upload photos to S3
- Share albums with clients
- View analytics and client activity

### Client
- View shared albums
- Favorite photos
- Download photos (if permitted)
- Track download history

### Admin
- Full system access
- Manage all users and albums
- View reports and analytics
- Configure system settings

## 🔄 Photo Upload Flow

1. Photographer requests pre-signed S3 URL
2. Client uploads photo directly to S3
3. Metadata saved to MongoDB
4. Photo appears in album instantly

**Benefits:**
- ⚡ Fast direct-to-S3 uploads
- 🔒 Secure pre-signed URLs
- 💰 Reduced server bandwidth costs
- 📈 Scalable for large files

## 🔗 Album Sharing

### Share Types

1. **Link Share**: Generate public link with optional password
2. **Email Invite**: Send personalized invitations
3. **Direct Share**: Share with registered users

### Features
- 🔐 Optional password protection
- ⏰ Expiration dates
- 🎛️ Granular permissions (view, download, favorite)
- 📊 Track views and access

## 🗄️ Database Schema

### Collections
- **users**: User accounts with roles
- **albums**: Photo album metadata
- **photos**: Photo metadata (files in S3)
- **albumshares**: Sharing permissions and tokens
- **favorites**: User favorite photos
- **downloads**: Download history tracking

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete schema details.

## 🔒 Security

- ✅ JWT authentication with httpOnly cookies
- ✅ Role-based access control (RBAC)
- ✅ bcrypt password hashing (10 rounds)
- ✅ Private S3 bucket with pre-signed URLs
- ✅ CORS configuration
- ✅ Server-side encryption (SSE-S3)
- ✅ Token expiration and validation
- ✅ Password-protected album sharing

## 🚢 Deployment

### Recommended: Vercel

1. **Connect GitHub repository**
2. **Add environment variables** in Vercel dashboard
3. **Deploy automatically** on push to main branch

### Environment Variables Required
```env
MONGODB_URI=...
JWT_SECRET=...
AWS_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=...
```

## 📊 AWS Costs (Estimated)

### Free Tier (First 12 months)
- S3 Storage: 5 GB free
- S3 Requests: 20,000 GET, 2,000 PUT
- CloudFront: 1 TB data transfer

### After Free Tier
- Storage: ~$0.023/GB/month
- 100 GB + 10,000 views ≈ **$3-5/month**

## 🛠️ Development

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Test S3 Connection
```bash
node test-s3.js
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Albums
- `GET /api/albums` - List albums
- `POST /api/albums` - Create album
- `GET /api/albums/[id]` - Get album
- `PUT /api/albums/[id]` - Update album
- `DELETE /api/albums/[id]` - Delete album

### Photos
- `GET /api/albums/[id]/photos` - List photos
- `POST /api/albums/[id]/photos` - Add photo metadata
- `POST /api/upload/presigned` - Get upload URL

### Sharing
- `POST /api/albums/[id]/share` - Share album
- `GET /api/albums/[id]/share` - Get shares
- `GET /api/shared/[token]` - Access shared album
- `POST /api/shared/[token]/verify` - Verify password

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

Need help? Check the documentation:
- [AWS Setup Guide](./AWS_SETUP_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Architecture](./ARCHITECTURE.md)

## 🎉 Credits

Built with:
- [Next.js](https://nextjs.org/)
- [MongoDB](https://www.mongodb.com/)
- [AWS S3](https://aws.amazon.com/s3/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Made with ❤️ for photographers and their clients**
