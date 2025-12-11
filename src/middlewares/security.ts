/**
 * Security Middleware
 * Input sanitization and security headers
 */

import { FastifyRequest, FastifyReply } from 'fastify';

import { sanitizeObject } from '@utils/validation.js';

/**
 * Input sanitization middleware
 * Sanitizes request body to prevent XSS and injection attacks
 */
export const sanitizeInput = async (
    request: FastifyRequest,
    _reply: FastifyReply
): Promise<void> => {
    if (request.body && typeof request.body === 'object') {
        request.body = sanitizeObject(request.body as Record<string, unknown>);
    }
};
