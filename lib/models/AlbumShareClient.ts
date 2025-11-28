import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAlbumShareClient extends Document {
    shareId: mongoose.Types.ObjectId;
    albumId: mongoose.Types.ObjectId;
    clientIdentifier: string;  // Unique identifier for this client (generated on frontend)
    name: string;
    email?: string;
    ipAddress?: string;
    userAgent?: string;

    // Statistics
    stats: {
        photoViews: number;
        favorites: number;
        comments: number;
        downloads: number;
    };

    lastAccessedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AlbumShareClientSchema = new Schema(
    {
        shareId: { type: Schema.Types.ObjectId, ref: "AlbumShare", required: true },
        albumId: { type: Schema.Types.ObjectId, ref: "Album", required: true },
        clientIdentifier: { type: String, required: true, trim: true },
        name: { type: String, required: true, trim: true },
        email: { type: String, trim: true },
        ipAddress: String,
        userAgent: String,

        stats: {
            photoViews: { type: Number, default: 0 },
            favorites: { type: Number, default: 0 },
            comments: { type: Number, default: 0 },
            downloads: { type: Number, default: 0 },
        },

        lastAccessedAt: { type: Date, default: Date.now },
    },
    { timestamps: true, strict: true }
);

// Indexes
AlbumShareClientSchema.index({ shareId: 1 });
AlbumShareClientSchema.index({ albumId: 1, clientIdentifier: 1 }, { unique: true }); // Unique client per album
AlbumShareClientSchema.index({ clientIdentifier: 1 });

// Delete the cached model to ensure the new schema is used
if (mongoose.models.AlbumShareClient) {
    delete mongoose.models.AlbumShareClient;
}

const AlbumShareClient: Model<IAlbumShareClient> =
    mongoose.model<IAlbumShareClient>("AlbumShareClient", AlbumShareClientSchema);

export default AlbumShareClient;
