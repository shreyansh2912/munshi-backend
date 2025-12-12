/**
 * Drizzle ORM Client for MySQL
 * Replaces Prisma with lightweight, TypeScript-first ORM
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

import { logger } from '@config/logger.js';
import { env } from '@config/env.js';
import * as schema from '../schema/index.js';

/**
 * MySQL connection pool
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'munshi',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

/**
 * Drizzle database instance
 */
export const db = drizzle(pool, {
    schema,
    mode: 'default',
    logger: env.NODE_ENV === 'development',
});

/**
 * Connect to database (test connection)
 */
export const connectMySQL = async (): Promise<void> => {
    try {
        const connection = await pool.getConnection();
        logger.info('MySQL database connected via Drizzle ORM');
        connection.release();
    } catch (error) {
        logger.error({ error }, 'Failed to connect to MySQL database');
        throw error;
    }
};

/**
 * Disconnect from database
 */
export const disconnectMySQL = async (): Promise<void> => {
    await pool.end();
    logger.info('MySQL database disconnected');
};

/**
 * Export pool for raw queries if needed
 */
export { pool };
