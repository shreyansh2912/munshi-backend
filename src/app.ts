/**
 * Fastify Application Setup
 * Configures Fastify with plugins, middleware, and routes
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';

import { env } from '@config/env.js';
import { logger } from '@config/logger.js';
import { corsConfig, helmetConfig } from '@config/security.js';
import { errorHandler } from '@middlewares/errorHandler.js';
import { ipLogger } from '@middlewares/ipLogger.js';
import { authRoutes } from '@modules/auth/auth.routes.js';
import { userRoutes } from '@modules/user/user.routes.js';
import { ledgerRoutes } from '@modules/ledger/ledger.routes.js';

/**
 * Create and configure Fastify app
 */
export const createApp = async () => {
    const app = Fastify({
        logger: logger,
        trustProxy: true,
        bodyLimit: env.MAX_FILE_SIZE,
    });

    // Register plugins
    await app.register(helmet, helmetConfig);
    await app.register(cors, corsConfig);
    await app.register(multipart, {
        limits: {
            fileSize: env.MAX_FILE_SIZE,
        },
    });

    // Global rate limiting
    await app.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
        redis: {
            host: env.REDIS_HOST,
            port: env.REDIS_PORT,
        },
    });

    // Global hooks
    app.addHook('onRequest', ipLogger);

    // Health check endpoint
    app.get('/health', async () => {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: env.NODE_ENV,
        };
    });

    // API routes
    await app.register(authRoutes, { prefix: `/api/${env.API_VERSION}/auth` });
    await app.register(userRoutes, { prefix: `/api/${env.API_VERSION}/users` });
    await app.register(ledgerRoutes, { prefix: `/api/${env.API_VERSION}/ledger` });

    // 404 handler
    app.setNotFoundHandler((request, reply) => {
        reply.status(404).send({
            success: false,
            statusCode: 404,
            message: 'Route not found',
            errorCode: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
        });
    });

    // Global error handler
    app.setErrorHandler(errorHandler);

    return app;
};
