/**
 * Database Transaction Wrapper
 * Utility for handling Drizzle transactions
 */

import { db } from './client.js';
import { DatabaseError } from '@helpers/errors.js';
import { logger } from '@config/logger.js';
import { ExtractTablesWithRelations } from 'drizzle-orm';
import { MySqlTransaction } from 'drizzle-orm/mysql2';
import { MySql2QueryResultHKT } from 'drizzle-orm/mysql2';
import * as schema from '../schema/index.js';

type TransactionClient = MySqlTransaction<
    MySql2QueryResultHKT,
    typeof schema,
    ExtractTablesWithRelations<typeof schema>
>;

/**
 * Execute a function within a database transaction
 * Automatically commits on success and rolls back on error
 *
 * @param callback - Function to execute within transaction
 * @returns Result of the callback
 * @throws DatabaseError if transaction fails
 */
export const withTransaction = async <T>(
    callback: (tx: TransactionClient) => Promise<T>
): Promise<T> => {
    try {
        return await db.transaction(async (tx) => {
            return await callback(tx);
        });
    } catch (error) {
        logger.error({ error }, 'Transaction failed');
        throw new DatabaseError('Database transaction failed', error);
    }
};
