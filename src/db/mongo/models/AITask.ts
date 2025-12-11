/**
 * AI Task Model (MongoDB)
 * Stores AI processing tasks and results
 */

import mongoose, { Schema, Document } from 'mongoose';

export enum AITaskStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

export enum AITaskType {
    OCR = 'ocr',
    CLASSIFICATION = 'classification',
    EXTRACTION = 'extraction',
    ANALYSIS = 'analysis',
}

export interface IAITask extends Document {
    userId: string;
    taskType: AITaskType;
    status: AITaskStatus;
    input: Record<string, unknown>;
    result?: Record<string, unknown>;
    error?: string;
    retryCount: number;
    maxRetries: number;
    createdAt: Date;
    processedAt?: Date;
}

const aiTaskSchema = new Schema<IAITask>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        taskType: {
            type: String,
            enum: Object.values(AITaskType),
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(AITaskStatus),
            default: AITaskStatus.PENDING,
            index: true,
        },
        input: {
            type: Schema.Types.Mixed,
            required: true,
        },
        result: {
            type: Schema.Types.Mixed,
        },
        error: {
            type: String,
        },
        retryCount: {
            type: Number,
            default: 0,
        },
        maxRetries: {
            type: Number,
            default: 3,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        processedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

export const AITask = mongoose.model<IAITask>('AITask', aiTaskSchema);
