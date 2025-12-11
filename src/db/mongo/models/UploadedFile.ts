/**
 * Uploaded File Model (MongoDB)
 * Stores metadata for uploaded documents
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IUploadedFile extends Document {
    userId: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    storagePath: string;
    uploadedAt: Date;
    metadata?: Record<string, unknown>;
}

const uploadedFileSchema = new Schema<IUploadedFile>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        fileName: {
            type: String,
            required: true,
        },
        originalName: {
            type: String,
            required: true,
        },
        mimeType: {
            type: String,
            required: true,
        },
        fileSize: {
            type: Number,
            required: true,
        },
        storagePath: {
            type: String,
            required: true,
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

export const UploadedFile = mongoose.model<IUploadedFile>('UploadedFile', uploadedFileSchema);
