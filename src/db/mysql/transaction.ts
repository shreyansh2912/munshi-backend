/**
 * Database Transaction Wrapper
 * Utility for handling Prisma transactions
 */

import { Prisma } from '@prisma/client';

import { prisma } from './client.js';
import { DatabaseError } from '@helpers/errors.js';
import { logger } from '@config/logger.js';

/**
 * Execute a function within a database transaction
 * Automatically commits on success and rolls back on error
 *
 * @param callback - Function to execute within transaction
 * @returns Result of the callback
 * @throws DatabaseError if transaction fails
 *
 * @example
 * ```ts
 * const result = await withTransaction(async (tx) => {
 *   const user = await tx.user.create({ data: userData });
 *   const ledger = await tx.ledger.create({ data: ledgerData });
 *   return { user, ledger };
 * });
 * ```
 */
export const withTransaction = async <T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> => {
    try {
        return await prisma.$transaction(async (tx) => {
            return await callback(tx);
        });
    } catch (error) {
        logger.error({ error }, 'Transaction failed');
        throw new DatabaseError('Database transaction failed', error);
    }
};
