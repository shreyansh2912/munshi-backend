/**
 * Event Log Model (MongoDB)
 * Stores application events and user actions
 */

import mongoose, { Schema, Document } from 'mongoose';

export enum EventLevel {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    CRITICAL = 'critical',
}

export interface IEventLog extends Document {
    userId?: string;
    level: EventLevel;
    eventType: string;
    message: string;
    data?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}

const eventLogSchema = new Schema<IEventLog>(
    {
        userId: {
            type: String,
            index: true,
        },
        level: {
            type: String,
            enum: Object.values(EventLevel),
            required: true,
            index: true,
        },
        eventType: {
            type: String,
            required: true,
            index: true,
        },
        message: {
            type: String,
            required: true,
        },
        data: {
            type: Schema.Types.Mixed,
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: false,
    }
);

// TTL index to auto-delete old logs after 90 days
eventLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export const EventLog = mongoose.model<IEventLog>('EventLog', eventLogSchema);
