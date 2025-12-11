/**
 * Prisma Client for MySQL
 * Singleton pattern to prevent multiple instances
 */

import { PrismaClient } from '@prisma/client';

import { logger } from '@config/logger.js';
import { env } from '@config/env.js';

/**
 * Prisma client instance with logging configuration
 */
const prismaClientSingleton = () => {
    return new PrismaClient({
        log:
            env.NODE_ENV === 'development'
                ? [
                    { level: 'query', emit: 'event' },
                    { level: 'error', emit: 'stdout' },
                    { level: 'warn', emit: 'stdout' },
                ]
                : [{ level: 'error', emit: 'stdout' }],
    });
};

declare global {
    // eslint-disable-next-line no-var
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

/**
 * Prisma client singleton
 */
export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = prisma;
}

// Log queries in development
if (env.NODE_ENV === 'development') {
    prisma.$on('query' as never, (e: unknown) => {
        const event = e as { query: string; params: string; duration: number };
        logger.debug(
            {
                query: event.query,
                params: event.params,
                duration: `${event.duration}ms`,
            },
            'Prisma Query'
        );
    });
}

/**
 * Connect to database
 */
export const connectMySQL = async (): Promise<void> => {
    try {
        await prisma.$connect();
        logger.info('MySQL database connected via Prisma');
    } catch (error) {
        logger.error({ error }, 'Failed to connect to MySQL database');
        throw error;
    }
};

/**
 * Disconnect from database
 */
export const disconnectMySQL = async (): Promise<void> => {
    await prisma.$disconnect();
    logger.info('MySQL database disconnected');
};
