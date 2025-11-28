import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAlbumShareInteraction extends Document {
    shareId: mongoose.Types.ObjectId;       // Share link reference
    albumId: mongoose.Types.ObjectId;       // Album reference
    photographerId: mongoose.Types.ObjectId;
    clientId?: mongoose.Types.ObjectId;     // Optional client identity tracking

    event:
    | "identity_entered"
    | "album_open"
    | "photo_view"
    | "photo_select"
    | "photo_unselect"
    | "photo_favorite"
    | "photo_unfavorite"
    | "comment_add"
    | "selection_submit";

    photoId?: mongoose.Types.ObjectId;      // for photo-related actions
    comment?: string;                       // when event = comment_add
    meta?: Record<string, any>;             // extra dynamic data

    ipAddress?: string;
    userAgent?: string;

    createdAt: Date;
}

const AlbumShareInteractionSchema = new Schema(
    {
        shareId: {
            type: Schema.Types.ObjectId,
            ref: "AlbumShare",
            required: true,
            index: true,
        },

        albumId: {
            type: Schema.Types.ObjectId,
            ref: "Album",
            required: true,
            index: true,
        },

        photographerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        clientId: {
            type: Schema.Types.ObjectId,
            ref: "AlbumShareClient", // optional: your identity model
            index: true,
        },

        event: {
            type: String,
            required: true,
            enum: [
                "identity_entered",
                "album_open",
                "photo_view",
                "photo_select",
                "photo_unselect",
                "photo_favorite",
                "photo_unfavorite",
                "comment_add",
                "selection_submit",
            ],
        },

        photoId: {
            type: Schema.Types.ObjectId,
            ref: "Photo",
        },

        comment: {
            type: String,
            trim: true,
        },

        meta: {
            type: Schema.Types.Mixed,
        },

        ipAddress: String,
        userAgent: String,
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// Indexes for fast analytics
AlbumShareInteractionSchema.index({ shareId: 1, event: 1 });
AlbumShareInteractionSchema.index({ clientId: 1, event: 1 });
AlbumShareInteractionSchema.index({ photoId: 1 });
AlbumShareInteractionSchema.index({ createdAt: -1 });

const AlbumShareInteraction: Model<IAlbumShareInteraction> =
    mongoose.models.AlbumShareInteraction ||
    mongoose.model<IAlbumShareInteraction>(
        "AlbumShareInteraction",
        AlbumShareInteractionSchema
    );

export default AlbumShareInteraction;
