/**
 * Server Entry Point
 * Starts the Fastify server and initializes all connections
 */

import { createApp } from './app.js';
import { env } from '@config/env.js';
import { logger } from '@config/logger.js';
import { connectMySQL, disconnectMySQL } from '@db/mysql/client.js';
import { connectMongoDB, disconnectMongoDB } from '@db/mongo/client.js';
import { closeRedis } from '@utils/redis.js';
import { closeQueues } from '@queue/client.js';

/**
 * Start the server
 */
const start = async () => {
    try {
        // Connect to databases
        logger.info('Connecting to databases...');
        await Promise.all([connectMySQL(), connectMongoDB()]);

        // Create Fastify app
        const app = await createApp();

        // Start server
        await app.listen({
            port: env.PORT,
            host: '0.0.0.0',
        });

        logger.info(
            {
                port: env.PORT,
                environment: env.NODE_ENV,
                apiVersion: env.API_VERSION,
            },
            'Server started successfully'
        );
    } catch (error) {
        logger.error({ error }, 'Failed to start server');
        process.exit(1);
    }
};

/**
 * Graceful shutdown
 */
const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');

    try {
        // Close database connections
        await Promise.all([disconnectMySQL(), disconnectMongoDB(), closeRedis(), closeQueues()]);

        logger.info('Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        logger.error({ error }, 'Error during shutdown');
        process.exit(1);
    }
};

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught exception');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.fatal({ reason, promise }, 'Unhandled rejection');
    process.exit(1);
});

// Start the server
start();
