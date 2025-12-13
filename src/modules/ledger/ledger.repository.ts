/**
 * Ledger Module - Repository
 */

import { db } from '@db/mysql/client.js';
import { ledgers } from '@db/schema/accounting.js';
import { eq, and, asc } from 'drizzle-orm';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export type Ledger = InferSelectModel<typeof ledgers>;
export type LedgerCreateInput = InferInsertModel<typeof ledgers>;
export type LedgerUpdateInput = Partial<LedgerCreateInput>;

/**
 * Create ledger account
 */
export const createLedger = async (data: LedgerCreateInput): Promise<Ledger> => {
    const id = uuidv4();
    await db.insert(ledgers).values({ ...data, id });
    const result = await db.select().from(ledgers).where(eq(ledgers.id, id));
    if (!result[0]) throw new Error('Failed to create ledger');
    return result[0];
};

/**
 * Find ledger by ID
 */
export const findById = async (id: string, userId: string): Promise<Ledger | undefined> => {
    const result = await db
        .select()
        .from(ledgers)
        .where(and(eq(ledgers.id, id), eq(ledgers.userId, userId)));
    return result[0];
};

/**
 * Find ledger by account code
 */
export const findByAccountCode = async (
    accountCode: string,
    userId: string
): Promise<Ledger | undefined> => {
    const result = await db
        .select()
        .from(ledgers)
        .where(and(eq(ledgers.accountCode, accountCode), eq(ledgers.userId, userId)));
    return result[0];
};

/**
 * List ledgers for user
 */
export const listLedgers = async (userId: string): Promise<Ledger[]> => {
    return db
        .select()
        .from(ledgers)
        .where(eq(ledgers.userId, userId))
        .orderBy(asc(ledgers.accountCode));
};

/**
 * Update ledger
 */
export const updateLedger = async (
    id: string,
    userId: string,
    data: LedgerUpdateInput
): Promise<Ledger> => {
    await db
        .update(ledgers)
        .set(data)
        .where(and(eq(ledgers.id, id), eq(ledgers.userId, userId)));

    const result = await db
        .select()
        .from(ledgers)
        .where(and(eq(ledgers.id, id), eq(ledgers.userId, userId)));

    if (!result[0]) throw new Error('Ledger not found or update failed');
    return result[0];
};

/**
 * Delete ledger (soft delete)
 */
export const deleteLedger = async (id: string, userId: string): Promise<Ledger> => {
    await db
        .update(ledgers)
        .set({ isActive: false })
        .where(and(eq(ledgers.id, id), eq(ledgers.userId, userId)));

    const result = await db
        .select()
        .from(ledgers)
        .where(and(eq(ledgers.id, id), eq(ledgers.userId, userId)));

    if (!result[0]) throw new Error('Ledger not found or delete failed');
    return result[0];
};
