/**
 * BullMQ Queue Client
 * Task queue setup with Redis
 */

import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

import { env } from '@config/env.js';
import { logger } from '@config/logger.js';

/**
 * Redis connection for BullMQ
 */
const connection = new IORedis({
    host: env.BULL_REDIS_HOST,
    port: env.BULL_REDIS_PORT,
    maxRetriesPerRequest: null,
});

/**
 * Email queue
 */
export const emailQueue = new Queue('email', { connection });

/**
 * OCR processing queue
 */
export const ocrQueue = new Queue('ocr', { connection });

/**
 * Queue events for monitoring
 */
const emailQueueEvents = new QueueEvents('email', { connection });
const ocrQueueEvents = new QueueEvents('ocr', { connection });

// Email queue event listeners
emailQueueEvents.on('completed', ({ jobId }) => {
    logger.info({ jobId }, 'Email job completed');
});

emailQueueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error({ jobId, failedReason }, 'Email job failed');
});

// OCR queue event listeners
ocrQueueEvents.on('completed', ({ jobId }) => {
    logger.info({ jobId }, 'OCR job completed');
});

ocrQueueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error({ jobId, failedReason }, 'OCR job failed');
});

/**
 * Close all queues
 */
export const closeQueues = async (): Promise<void> => {
    await Promise.all([
        emailQueue.close(),
        ocrQueue.close(),
        emailQueueEvents.close(),
        ocrQueueEvents.close(),
        connection.quit(),
    ]);
    logger.info('All queues closed');
};
