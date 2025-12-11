/**
 * OCR Job Processor
 * Example job processor for OCR tasks
 */

import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

import { env } from '@config/env.js';
import { logger } from '@config/logger.js';

/**
 * OCR job data interface
 */
interface OCRJobData {
    fileId: string;
    userId: string;
    filePath: string;
}

/**
 * Redis connection for worker
 */
const connection = new IORedis({
    host: env.BULL_REDIS_HOST,
    port: env.BULL_REDIS_PORT,
    maxRetriesPerRequest: null,
});

/**
 * OCR job processor
 */
const processOCRJob = async (job: Job<OCRJobData>): Promise<void> => {
    logger.info({ jobId: job.id, data: job.data }, 'Processing OCR job');

    // TODO: Implement actual OCR processing logic
    // For now, just simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    logger.info({ jobId: job.id }, 'OCR processing completed');
};

/**
 * OCR worker
 */
export const ocrWorker = new Worker('ocr', processOCRJob, {
    connection,
    concurrency: 3,
    limiter: {
        max: 5,
        duration: 1000,
    },
});

ocrWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'OCR worker completed job');
});

ocrWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'OCR worker failed job');
});
