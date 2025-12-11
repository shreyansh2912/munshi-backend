/**
 * IP Logging Middleware
 * Logs IP addresses and tracks suspicious patterns
 */

import { FastifyRequest, FastifyReply } from 'fastify';

import { logger } from '@config/logger.js';
import { EventLog, EventLevel } from '@db/mongo/models/EventLog.js';

/**
 * IP logging middleware
 * Logs all incoming requests with IP and user agent
 */
export const ipLogger = async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const ipAddress = request.ip;
    const userAgent = request.headers['user-agent'] ?? 'Unknown';
    const userId = request.user?.id;

    // Log to application logger
    logger.info(
        {
            ip: ipAddress,
            userAgent,
            userId,
            method: request.method,
            url: request.url,
        },
        'Incoming request'
    );

    // Store in MongoDB for analytics (fire and forget)
    EventLog.create({
        userId,
        level: EventLevel.INFO,
        eventType: 'http_request',
        message: `${request.method} ${request.url}`,
        data: {
            method: request.method,
            url: request.url,
            headers: request.headers,
        },
        ipAddress,
        userAgent,
    }).catch((error) => {
        logger.error({ error }, 'Failed to log event to MongoDB');
    });
};
