/**
 * Email Job Processor
 * Example job processor for sending emails
 */

import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

import { env } from '@config/env.js';
import { logger } from '@config/logger.js';

/**
 * Email job data interface
 */
interface EmailJobData {
    to: string;
    subject: string;
    body: string;
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
 * Email job processor
 */
const processEmailJob = async (job: Job<EmailJobData>): Promise<void> => {
    logger.info({ jobId: job.id, data: job.data }, 'Processing email job');

    // TODO: Implement actual email sending logic
    // For now, just simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.info({ jobId: job.id }, 'Email sent successfully');
};

/**
 * Email worker
 */
export const emailWorker = new Worker('email', processEmailJob, {
    connection,
    concurrency: 5,
    limiter: {
        max: 10,
        duration: 1000,
    },
});

emailWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Email worker completed job');
});

emailWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Email worker failed job');
});
