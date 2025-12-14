/**
 * Payments Module - Validation Schemas
 */

import { z } from 'zod';

/**
 * Schema for creating a payment
 */
export const createPaymentSchema = z.object({
    paymentNumber: z.string().max(100),
    paymentType: z.enum(['receipt', 'payment']),
    paymentDate: z.string().or(z.date()),
    partyType: z.enum(['customer', 'supplier', 'other']),
    partyId: z.number(),
    amount: z.number(),
    currency: z.string().length(3).default('INR'),
    exchangeRate: z.string().optional(),
    paymentMethod: z.enum(['cash', 'bank_transfer', 'upi', 'card', 'cheque', 'dd', 'other']),
    bankAccountId: z.number().optional(),
    referenceNumber: z.string().max(255).optional(),
    chequeNumber: z.string().max(100).optional(),
    chequeDate: z.string().or(z.date()).optional(),
    upiTransactionId: z.string().max(255).optional(),
    notes: z.string().max(1000).optional(),
    status: z.enum(['pending', 'cleared', 'bounced', 'cancelled']).default('cleared'),
    clearedAt: z.string().or(z.date()).optional(),
    journalEntryId: z.number().optional(),
});

/**
 * Schema for updating a payment
 */
export const updatePaymentSchema = z.object({
    paymentNumber: z.string().max(100).optional(),
    paymentType: z.enum(['receipt', 'payment']).optional(),
    paymentDate: z.string().or(z.date()).optional(),
    partyType: z.enum(['customer', 'supplier', 'other']).optional(),
    partyId: z.number().optional(),
    amount: z.number().optional(),
    currency: z.string().length(3).optional(),
    exchangeRate: z.string().optional(),
    paymentMethod: z.enum(['cash', 'bank_transfer', 'upi', 'card', 'cheque', 'dd', 'other']).optional(),
    bankAccountId: z.number().optional(),
    referenceNumber: z.string().max(255).optional(),
    chequeNumber: z.string().max(100).optional(),
    chequeDate: z.string().or(z.date()).optional(),
    upiTransactionId: z.string().max(255).optional(),
    notes: z.string().max(1000).optional(),
    status: z.enum(['pending', 'cleared', 'bounced', 'cancelled']).optional(),
    clearedAt: z.string().or(z.date()).optional(),
});

/**
 * Schema for payment allocation
 */
export const createPaymentAllocationSchema = z.object({
    invoiceId: z.number(),
    allocatedAmount: z.number(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type CreatePaymentAllocationInput = z.infer<typeof createPaymentAllocationSchema>;
