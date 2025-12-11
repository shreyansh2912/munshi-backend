/**
 * OCR Result Model (MongoDB)
 * Stores OCR processing results
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IOCRResult extends Document {
    fileId: string;
    userId: string;
    extractedText: string;
    confidence: number;
    language?: string;
    processedAt: Date;
    metadata?: Record<string, unknown>;
}

const ocrResultSchema = new Schema<IOCRResult>(
    {
        fileId: {
            type: String,
            required: true,
            index: true,
        },
        userId: {
            type: String,
            required: true,
            index: true,
        },
        extractedText: {
            type: String,
            required: true,
        },
        confidence: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        language: {
            type: String,
        },
        processedAt: {
            type: Date,
            default: Date.now,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

export const OCRResult = mongoose.model<IOCRResult>('OCRResult', ocrResultSchema);
