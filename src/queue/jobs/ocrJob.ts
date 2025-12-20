/**
 * OCR Job Processor with AI Integration
 * 
 * Processes uploaded invoices/receipts using OCR and AI for data extraction.
 */

import { Worker, Job } from 'bull mq';
import IORedis from 'ioredis';
import { createWorker } from 'tesseract.js';

import { env } from '@config/env.js';
import { logger } from '@config/logger.js';
import { extractInvoiceData } from '@services/ai.service.js';

/**
 * OCR job data interface
 */
interface OCRJobData {
    fileId: string;
    userId: string;
    filePath: string;
    orgId: number;
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
 * OCR job processor with AI integration
 */
const processOCRJob = async (job: Job<OCRJobData>): Promise<void> => {
    logger.info({ jobId: job.id, data: job.data }, 'Processing OCR job');

    try {
        // Step 1: Extract text from image using Tesseract.js
        logger.info({ fileId: job.data.fileId }, 'Starting OCR text extraction');

        const worker = await createWorker('eng');
        const { data: { text } } = await worker.recognize(job.data.filePath);
        await worker.terminate();

        logger.info({ fileId: job.data.fileId, textLength: text.length }, 'Text extracted from image');

        // Step 2: Use AI to extract structured data from text
        logger.info({ fileId: job.data.fileId }, 'Extracting invoice data using AI');

        const invoiceData = await extractInvoiceData(text);

        logger.info(
            {
                fileId: job.data.fileId,
                invoiceNumber: invoiceData.invoiceNumber,
                confidence: invoiceData.confidence
            },
            'Invoice data extracted successfully'
        );

        // Step 3: Store extracted data (implement based on your needs)
        // You could:
        // - Save to MongoDB for review
        // - Auto-create invoice if confidence > 0.8
        // - Send notification to user for review

        // TODO: Implement data storage logic
        // Example:
        // await db.extractedInvoices.create({
        //     fileId: job.data.fileId,
        //     userId: job.data.userId,
        //     orgId: job.data.orgId,
        //     rawText: text,
        //     extractedData: invoiceData,
        //     status: invoiceData.confidence > 0.8 ? 'auto-created' : 'needs-review',
        // });

        logger.info({ jobId: job.id }, 'OCR processing completed successfully');
    } catch (error: any) {
        logger.error({ jobId: job.id, error }, 'OCR processing failed');
        throw error;
    }
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
