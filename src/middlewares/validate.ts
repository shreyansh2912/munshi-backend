/**
 * Validation Middleware
 * Zod-based request validation for body, query, and params
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z, ZodSchema } from 'zod';

import { ValidationError } from '@helpers/errors.js';
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
    return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
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
                // Format Zod errors
                const errors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                throw new ValidationError('Validation failed', { errors });
            }

            throw error;
        }
    };
};
