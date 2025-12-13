/**
 * Rate Limiting Middleware
 * Redis-based rate limiting with different strategies
 */

import { FastifyRequest, FastifyReply } from 'fastify';

import { incrementCache } from '@utils/redis.js';
import { RateLimitError } from '@helpers/errors.js';
import { logger } from '@config/logger.js';

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
    max: number;
    windowMs: number;
    keyPrefix?: string;
}

/**
 * Parse time window string to milliseconds
 */
const parseTimeWindow = (window: string): number => {
    const match = window.match(/^(\d+)(ms|s|m|h|d)$/);
    if (!match) {
        throw new Error(`Invalid time window format: ${window}`);
    }

    const value = parseInt(match[1]!, 10);
    const unit = match[2]!;

    const multipliers: Record<string, number> = {
        ms: 1,
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit]!;
};

/**
 * Create rate limiting middleware
 *
 * @param config - Rate limit configuration
 * @returns Middleware function
 *
 * @example
 * ```ts
 * const authLimiter = createRateLimiter({
 *   max: 5,
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   keyPrefix: 'auth'
 * });
 * ```
 */
export const createRateLimiter = (config: RateLimitConfig) => {
    const { max, windowMs, keyPrefix = 'ratelimit' } = config;
    const windowSeconds = Math.ceil(windowMs / 1000);

    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        try {
            // Generate key based on IP or user ID
            const identifier = request.user?.id ?? request.ip;
            const key = `${keyPrefix}:${identifier}`;

            // Increment counter
            const current = await incrementCache(key, windowSeconds);

            // Set rate limit headers
            reply.header('X-RateLimit-Limit', max);
            reply.header('X-RateLimit-Remaining', Math.max(0, max - current));
            reply.header('X-RateLimit-Reset', Date.now() + windowMs);

            // Check if limit exceeded
            if (current > max) {
                logger.warn(
                    {
                        identifier,
                        current,
                        max,
                        keyPrefix,
                    },
                    'Rate limit exceeded'
                );

                throw new RateLimitError(
                    `Too many requests. Please try again later.`,
                    {
                        retryAfter: windowSeconds,
                    }
                );
            }
        } catch (error) {
            // Re-throw RateLimitError
            if (error instanceof RateLimitError) {
                throw error;
            }

            // Log Redis errors but don't block requests
            logger.error({ error }, 'Rate limiter error');
        }
    };
};

/**
 * Global rate limiter (100 requests per minute)
 */
export const globalRateLimiter = createRateLimiter({
    max: 100,
    windowMs: 60 * 1000,
    keyPrefix: 'global',
});

/**
 * Auth rate limiter (10 requests per 15 minutes)
 */
export const authRateLimiter = createRateLimiter({
    max: 10000,
    windowMs: 1 * 1000,
    // windowMs: 15 * 60 * 1000,
    keyPrefix: 'auth',
});

/**
 * API rate limiter (100 requests per minute)
 */
export const apiRateLimiter = createRateLimiter({
    max: 100,
    windowMs: 60 * 1000,
    keyPrefix: 'api',
});

/**
 * Strict rate limiter (10 requests per minute)
 */
export const strictRateLimiter = createRateLimiter({
    max: 10,
    windowMs: 60 * 1000,
    keyPrefix: 'strict',
});
