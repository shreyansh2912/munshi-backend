/**
 * Ledger Module - Service
 */

import type { Ledger } from './ledger.repository.js';

import * as ledgerRepo from './ledger.repository.js';
import { ConflictError, NotFoundError } from '@helpers/errors.js';
import type { CreateLedgerInput, UpdateLedgerInput } from './ledger.validation.js';

/**
 * Create ledger account
 */
export const createLedger = async (
    userId: string,
    data: CreateLedgerInput
): Promise<Ledger> => {
    // Check if account code already exists
    const existing = await ledgerRepo.findByAccountCode(data.accountCode, userId);
    if (existing) {
        throw new ConflictError('Account code already exists');
    }

    // Verify parent exists if provided
    if (data.parentId) {
        const parent = await ledgerRepo.findById(data.parentId, userId);
        if (!parent) {
            throw new NotFoundError('Parent account not found');
        }
    }

    return ledgerRepo.createLedger({
        ...data,
        userId,
        // parentId is already in data if provided
    });
};

/**
 * Get ledger account
 */
export const getLedger = async (id: string, userId: string): Promise<Ledger> => {
    const ledger = await ledgerRepo.findById(id, userId);
    if (!ledger) {
        throw new NotFoundError('Ledger account not found');
    }
    return ledger;
};

/**
 * List all ledger accounts
 */
export const listLedgers = async (userId: string): Promise<Ledger[]> => {
    return ledgerRepo.listLedgers(userId);
};

/**
 * Update ledger account
 */
export const updateLedger = async (
    id: string,
    userId: string,
    data: UpdateLedgerInput
): Promise<Ledger> => {
    const ledger = await ledgerRepo.findById(id, userId);
    if (!ledger) {
        throw new NotFoundError('Ledger account not found');
    }

    return ledgerRepo.updateLedger(id, userId, data);
};

/**
 * Delete ledger account (soft delete)
 */
export const deleteLedger = async (id: string, userId: string): Promise<void> => {
    const ledger = await ledgerRepo.findById(id, userId);
    if (!ledger) {
        throw new NotFoundError('Ledger account not found');
    }

    await ledgerRepo.deleteLedger(id, userId);
};
