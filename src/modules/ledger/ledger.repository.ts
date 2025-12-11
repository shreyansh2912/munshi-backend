/**
 * Ledger Module - Repository
 */

import { Ledger, Prisma } from '@prisma/client';

import { prisma } from '@db/mysql/client.js';

/**
 * Create ledger account
 */
export const createLedger = async (data: Prisma.LedgerCreateInput): Promise<Ledger> => {
    return prisma.ledger.create({ data });
};

/**
 * Find ledger by ID
 */
export const findById = async (id: string, userId: string): Promise<Ledger | null> => {
    return prisma.ledger.findFirst({
        where: { id, userId },
    });
};

/**
 * Find ledger by account code
 */
export const findByAccountCode = async (
    accountCode: string,
    userId: string
): Promise<Ledger | null> => {
    return prisma.ledger.findFirst({
        where: { accountCode, userId },
    });
};

/**
 * List ledgers for user
 */
export const listLedgers = async (userId: string): Promise<Ledger[]> => {
    return prisma.ledger.findMany({
        where: { userId },
        orderBy: { accountCode: 'asc' },
    });
};

/**
 * Update ledger
 */
export const updateLedger = async (
    id: string,
    userId: string,
    data: Prisma.LedgerUpdateInput
): Promise<Ledger> => {
    return prisma.ledger.update({
        where: { id, userId },
        data,
    });
};

/**
 * Delete ledger (soft delete)
 */
export const deleteLedger = async (id: string, userId: string): Promise<Ledger> => {
    return prisma.ledger.update({
        where: { id, userId },
        data: { isActive: false },
    });
};
