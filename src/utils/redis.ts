/**
 * Redis Client and Cache Utilities
 * Redis connection and caching helper functions
 */

import Redis from 'ioredis';

import { env } from '@config/env.js';
import { logger } from '@config/logger.js';

/**
 * Redis client instance
 */
export const redis = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
            return true;
        }
        return false;
    },
});

// Redis event handlers
redis.on('connect', () => {
    logger.info('Redis client connected');
});

redis.on('ready', () => {
    logger.info('Redis client ready');
});

redis.on('error', (err) => {
    logger.error({ err }, 'Redis client error');
});

redis.on('close', () => {
    logger.warn('Redis client connection closed');
});

redis.on('reconnecting', () => {
    logger.info('Redis client reconnecting');
});

/**
 * Cache helper functions
 */

/**
 * Get a value from cache
 *
 * @param key - Cache key
 * @returns Cached value or null
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
    try {
        const value = await redis.get(key);
        if (!value) {
            return null;
        }
        return JSON.parse(value) as T;
    } catch (error) {
        logger.error({ error, key }, 'Error getting cache');
        return null;
    }
};

/**
 * Set a value in cache
 *
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttl - Time to live in seconds (optional)
 */
export const setCache = async <T>(key: string, value: T, ttl?: number): Promise<void> => {
    try {
        const serialized = JSON.stringify(value);
        if (ttl) {
            await redis.setex(key, ttl, serialized);
        } else {
            await redis.set(key, serialized);
        }
    } catch (error) {
        logger.error({ error, key }, 'Error setting cache');
    }
};

/**
 * Delete a value from cache
 *
 * @param key - Cache key
 */
export const deleteCache = async (key: string): Promise<void> => {
    try {
        await redis.del(key);
    } catch (error) {
        logger.error({ error, key }, 'Error deleting cache');
    }
};

/**
 * Delete multiple keys matching a pattern
 *
 * @param pattern - Key pattern (e.g., 'user:*')
 */
export const deleteCachePattern = async (pattern: string): Promise<void> => {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (error) {
        logger.error({ error, pattern }, 'Error deleting cache pattern');
    }
};

/**
 * Check if a key exists in cache
 *
 * @param key - Cache key
 * @returns True if key exists
 */
export const cacheExists = async (key: string): Promise<boolean> => {
    try {
        const exists = await redis.exists(key);
        return exists === 1;
    } catch (error) {
        logger.error({ error, key }, 'Error checking cache existence');
        return false;
    }
};

/**
 * Increment a counter in cache
 *
 * @param key - Cache key
 * @param ttl - Time to live in seconds (optional, only set on first increment)
 * @returns New counter value
 */
export const incrementCache = async (key: string, ttl?: number): Promise<number> => {
    try {
        const value = await redis.incr(key);
        if (value === 1 && ttl) {
            await redis.expire(key, ttl);
        }
        return value;
    } catch (error) {
        logger.error({ error, key }, 'Error incrementing cache');
        return 0;
    }
};

/**
 * Gracefully close Redis connection
 */
export const closeRedis = async (): Promise<void> => {
    await redis.quit();
    logger.info('Redis connection closed');
};
