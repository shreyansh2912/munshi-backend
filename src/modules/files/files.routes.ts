/**
 * Files Module - Routes
 * API endpoints for file upload and management
 */

import { FastifyInstance } from 'fastify';
import { authenticate } from '@middlewares/auth.js';
import {
    uploadFileHandler,
    getFileHandler,
    listFilesHandler,
    getFileUrlHandler,
    downloadFileHandler,
    deleteFileHandler,
    updateVisibilityHandler,
} from './files.controller.js';

/**
 * Register file routes
 * @param fastify - Fastify instance
 */
export const filesRoutes = async (fastify: FastifyInstance): Promise<void> => {
    // Apply authentication to all routes
    fastify.addHook('preHandler', authenticate);

    // File management routes
    fastify.post('/upload', uploadFileHandler);
    fastify.get('/', listFilesHandler);
    fastify.get('/:uuid', getFileHandler);
    fastify.get('/:uuid/url', getFileUrlHandler);
    fastify.get('/:uuid/download', downloadFileHandler);
    fastify.delete('/:uuid', deleteFileHandler);
    fastify.patch('/:uuid/visibility', updateVisibilityHandler);
};
