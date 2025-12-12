/**
 * Prisma Client for MySQL
 * Singleton instance to prevent multiple connections
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger.js';

export type { DeviceFingerprint, RefreshToken, UserCreateInput, RefreshTokenCreateInput } from '../../types/index.js';

/**
 * Prisma Client singleton
 */
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
});

if (process.env['NODE_ENV'] !== 'production') {
    globalForPrisma.prisma = prisma;
}

/**
 * Connect to database
 */
export const connectPrisma = async (): Promise<void> => {
    try {
        await prisma.$connect();
        logger.info('Prisma client connected to MySQL database');
    } catch (error) {
        logger.error({ error }, 'Failed to connect Prisma client to MySQL database');
        throw error;
    }
};

/**
 * Disconnect from database
 */
export const disconnectPrisma = async (): Promise<void> => {
    await prisma.$disconnect();
    logger.info('Prisma client disconnected from MySQL database');
};
