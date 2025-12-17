/**
 * Global Error Handler Middleware
 * Catches and formats all errors using errorJson helper
 */

import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

import { AppError, ValidationError, isOperationalError } from '@helpers/errors.js';
import { errorJson } from '@helpers/response.js';
import { logger } from '@config/logger.js';
import { env } from '@config/env.js';

/**
 * Global error handler
 * Formats errors and sends appropriate responses
 */
export const errorHandler = (
    error: FastifyError | AppError | Error,
    request: FastifyRequest,
    reply: FastifyReply
): FastifyReply => {
    // Log error
    logger.error(
        {
            error,
            url: request.url,
            method: request.method,
            userId: request.user?.id,
        },
        'Error occurred'
    );

    // Handle AppError instances (including ValidationError)
    if (error instanceof AppError) {
        // Always include details for ValidationError, regardless of environment
        const shouldIncludeDetails =
            error instanceof ValidationError ||
            env.NODE_ENV === 'development';

        return errorJson(reply, {
            statusCode: error.statusCode,
            message: error.message,
            errorCode: error.errorCode,
            details: shouldIncludeDetails ? error.details : undefined,
        });
    }

    // Handle Fastify validation errors (JSON schema errors)
    if ('validation' in error && error.validation) {
        // Format Fastify validation errors to match our format
        const formattedErrors = Array.isArray(error.validation)
            ? error.validation.map((err: any) => ({
                field: err.instancePath?.replace(/^\//, '').replace(/\//g, '.') || err.params?.missingProperty || 'unknown',
                message: err.message || 'Validation failed',
            }))
            : [];

        return errorJson(reply, {
            statusCode: 400,
            message: 'Validation failed',
            errorCode: 'VALIDATION_ERROR',
            details: { errors: formattedErrors },
        });
    }

    // Handle Fastify errors
    if ('statusCode' in error && error.statusCode) {
        return errorJson(reply, {
            statusCode: error.statusCode,
            message: error.message,
            errorCode: 'FASTIFY_ERROR',
        });
    }

    // Handle unexpected errors
    const isOperational = isOperationalError(error);

    // In production, hide internal error details (SQL queries, stack traces, etc.)
    const message =
        env.NODE_ENV === 'production' && !isOperational
            ? 'Internal server error'
            : error.message;

    return errorJson(reply, {
        statusCode: 500,
        message,
        errorCode: 'INTERNAL_SERVER_ERROR',
        details: env.NODE_ENV === 'development' ? { stack: error.stack } : undefined,
    });
};
