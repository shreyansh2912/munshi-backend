/**
 * Validation Middleware
 * Zod-based request validation for body, query, and params
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z, ZodSchema } from 'zod';

import { sanitizeObject } from '@utils/validation.js';

/**
 * Validation schemas for different parts of the request
 */
interface ValidationSchemas {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}

/**
 * Create validation middleware
 *
 * @param schemas - Validation schemas for body, query, and/or params
 * @returns Middleware function
 *
 * @example
 * ```ts
 * const validateLogin = validate({
 *   body: z.object({
 *     email: z.string().email(),
 *     password: z.string().min(8)
 *   })
 * });
 * ```
 */
export const validate = (schemas: ValidationSchemas) => {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        try {
            // Validate and sanitize body
            if (schemas.body) {
                const sanitized = sanitizeObject(request.body as Record<string, unknown>);
                request.body = schemas.body.parse(sanitized);
            }

            // Validate query parameters
            if (schemas.query) {
                request.query = schemas.query.parse(request.query);
            }

            // Validate route parameters
            if (schemas.params) {
                request.params = schemas.params.parse(request.params);
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                // Convert Zod errors to object format: { fieldName: "error message" }
                const errors: Record<string, string> = {};
                error.errors.forEach((err) => {
                    const fieldName = err.path.join('.');
                    errors[fieldName] = err.message;
                });

                // Send error response directly - this bypasses Fastify's default error serialization
                return reply.status(400).send({
                    success: false,
                    statusCode: 400,
                    message: 'Validation failed',
                    errorCode: 'VALIDATION_ERROR',
                    errors,
                    timestamp: new Date().toISOString(),
                });
            }

            // Re-throw non-validation errors
            throw error;
        }
    };
};
