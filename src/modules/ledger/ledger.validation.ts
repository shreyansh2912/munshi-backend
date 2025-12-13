/**
 * Ledger Module - Validation Schemas
 */

import { z } from 'zod';
import { ACCOUNT_TYPES } from '../../types';

/**
 * Create ledger account schema
 */
export const createLedgerSchema = z.object({
    accountCode: z.string().min(1, 'Account code is required').max(20),
    accountName: z.string().min(1, 'Account name is required').max(100),
    accountType: z.enum(ACCOUNT_TYPES),
    parentId: z.string().uuid().optional(),
    description: z.string().max(500).optional(),
});

/**
 * Update ledger account schema
 */
export const updateLedgerSchema = z.object({
    accountName: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    isActive: z.boolean().optional(),
});

/**
 * Type exports
 */
export type CreateLedgerInput = z.infer<typeof createLedgerSchema>;
export type UpdateLedgerInput = z.infer<typeof updateLedgerSchema>;
