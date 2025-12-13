/**
 * Fastify Application Setup
 * Configures Fastify with plugins, middleware, and routes
 */

import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';

import { redis } from '@utils/redis.js';

import { env } from '@config/env.js';
import { logger, loggerOptions } from '@config/logger.js';
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
        logger: loggerOptions,
        trustProxy: true,
        bodyLimit: env.MAX_FILE_SIZE,
    });

    // Register plugins
    await app.register(cookie, {
        secret: env.JWT_ACCESS_SECRET, // Use JWT secret for cookie signing
        hook: 'onRequest',
        parseOptions: {}
    });
    await app.register(helmet, helmetConfig);
    await app.register(cors, corsConfig as any);
    await app.register(multipart, {
        limits: {
            fileSize: env.MAX_FILE_SIZE,
        },
    });

    // Global rate limiting
    await app.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
        redis: redis,
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

    // Import and register new routes
    const { customersRoutes } = await import('@modules/customers/customers.routes.js');
    const { invoicesRoutes } = await import('@modules/invoices/invoices.routes.js');
    const { productsRoutes } = await import('@modules/products/products.routes.js');
    const { paymentsRoutes } = await import('@modules/payments/payments.routes.js');
    const { organizationsRoutes } = await import('@modules/organizations/organizations.routes.js');

    await app.register(customersRoutes, { prefix: `/api/${env.API_VERSION}/customers` });
    await app.register(invoicesRoutes, { prefix: `/api/${env.API_VERSION}/invoices` });
    await app.register(productsRoutes, { prefix: `/api/${env.API_VERSION}/products` });
    await app.register(paymentsRoutes, { prefix: `/api/${env.API_VERSION}/payments` });
    await app.register(organizationsRoutes, { prefix: `/api/${env.API_VERSION}/organizations` });

    // 404 handler
    app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
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
