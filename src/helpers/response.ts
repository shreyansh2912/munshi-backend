/**
 * Response Helpers
 * Standardized JSON response builders for success and error cases
 */

import { FastifyReply } from 'fastify';
import type { SuccessResponse, ErrorResponse, SuccessOptions, ErrorOptions } from '../types';

/**
 * Send a standardized success response
 *
 * @param reply - Fastify reply object
 * @param options - Success response options
 * @returns Fastify reply
 *
 * @example
 * ```ts
 * return successJson(reply, {
 *   statusCode: 200,
 *   message: 'User created successfully',
 *   data: user
 * });
 * ```
 */
export const successJson = <T = unknown>(
    reply: FastifyReply,
    options: SuccessOptions<T> = {}
): FastifyReply => {
    const { statusCode = 200, message = 'Success', data = null } = options;

    const response: SuccessResponse<T> = {
        success: true,
        statusCode,
        message,
        data: data as T,
        timestamp: new Date().toISOString(),
    };

    return reply.status(statusCode).send(response);
};

/**
 * Send a standardized error response
 *
 * @param reply - Fastify reply object
 * @param options - Error response options
 * @returns Fastify reply
 *
 * @example
 * ```ts
 * return errorJson(reply, {
 *   statusCode: 400,
 *   message: 'Invalid email format',
 *   errorCode: 'VALIDATION_ERROR',
 *   details: { field: 'email' }
 * });
 * ```
 */
export const errorJson = (reply: FastifyReply, options: ErrorOptions): FastifyReply => {
    const { statusCode, message, errorCode, details } = options;

    const response: ErrorResponse = {
        success: false,
        statusCode,
        message,
        errorCode,
        ...(details && typeof details === 'object' && details !== null ? { details } : {}),
        timestamp: new Date().toISOString(),
    };

    return reply.status(statusCode).send(response);
};
