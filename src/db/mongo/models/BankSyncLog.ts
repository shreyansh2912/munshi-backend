/**
 * Bank Sync Log Model (MongoDB)
 * Stores bank synchronization logs
 */

import mongoose, { Schema, Document } from 'mongoose';

export enum SyncStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    SUCCESS = 'success',
    FAILED = 'failed',
    PARTIAL = 'partial',
}

export interface IBankSyncLog extends Document {
    userId: string;
    bankName: string;
    accountNumber: string;
    syncStatus: SyncStatus;
    transactionsSynced: number;
    startTime: Date;
    endTime?: Date;
    error?: string;
    metadata?: Record<string, unknown>;
}

const bankSyncLogSchema = new Schema<IBankSyncLog>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        bankName: {
            type: String,
            required: true,
        },
        accountNumber: {
            type: String,
            required: true,
        },
        syncStatus: {
            type: String,
            enum: Object.values(SyncStatus),
            default: SyncStatus.PENDING,
            index: true,
        },
        transactionsSynced: {
            type: Number,
            default: 0,
        },
        startTime: {
            type: Date,
            default: Date.now,
            index: true,
        },
        endTime: {
            type: Date,
        },
        error: {
            type: String,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

export const BankSyncLog = mongoose.model<IBankSyncLog>('BankSyncLog', bankSyncLogSchema);
