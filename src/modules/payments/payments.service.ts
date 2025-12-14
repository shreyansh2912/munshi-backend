/**
 * Payments Module - Service
 * Business logic for payment operations
 */

import { db } from '@db/mysql/client.js';
import { payments, paymentAllocations } from '@db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { CreatePaymentInput, UpdatePaymentInput, CreatePaymentAllocationInput } from './payments.validation.js';
import { NotFoundError } from '@helpers/errors.js';

/**
 * Create a new payment
 * @param orgId - Organization ID
 * @param userId - User ID (created by)
 * @param data - Payment creation data
 * @returns Created payment
 */
export const createPayment = async (orgId: number, userId: string, data: CreatePaymentInput) => {
    const [payment] = await db
        .insert(payments)
        .values({
            orgId,
            uuid: uuidv4(),
            createdBy: userId,
            ...data,
        })
        .$returningId();

    return getPayment(payment.id.toString(), orgId);
};

/**
 * Get payment by ID
 * @param id - Payment ID
 * @param orgId - Organization ID
 * @returns Payment details
 */
export const getPayment = async (id: string, orgId: number) => {
    const payment = await db.query.payments.findFirst({
        where: and(eq(payments.id, parseInt(id)), eq(payments.orgId, orgId)),
    });

    if (!payment) {
        throw new NotFoundError('Payment not found');
    }

    return payment;
};

/**
 * List all payments for an organization
 * @param orgId - Organization ID
 * @returns Array of payments ordered by date
 */
export const listPayments = async (orgId: number) => {
    return db.query.payments.findMany({
        where: eq(payments.orgId, orgId),
        orderBy: [desc(payments.paymentDate), desc(payments.createdAt)],
    });
};

/**
 * Update payment
 * @param id - Payment ID
 * @param orgId - Organization ID
 * @param data - Payment update data
 * @returns Updated payment
 */
export const updatePayment = async (id: string, orgId: number, data: UpdatePaymentInput) => {
    const [updated] = await db
        .update(payments)
        .set(data)
        .where(and(eq(payments.id, parseInt(id)), eq(payments.orgId, orgId)))
        .$returningId();

    if (!updated) {
        throw new NotFoundError('Payment not found');
    }

    return getPayment(id, orgId);
};

/**
 * Delete payment (soft delete)
 * @param id - Payment ID
 * @param orgId - Organization ID
 * @returns Success status
 */
export const deletePayment = async (id: string, orgId: number) => {
    const [deleted] = await db
        .update(payments)
        .set({ deletedAt: new Date() })
        .where(and(eq(payments.id, parseInt(id)), eq(payments.orgId, orgId)))
        .$returningId();

    if (!deleted) {
        throw new NotFoundError('Payment not found');
    }

    return true;
};

/**
 * Create payment allocation to invoice
 * @param paymentId - Payment ID
 * @param orgId - Organization ID
 * @param data - Allocation data
 * @returns Created allocation
 */
export const createPaymentAllocation = async (
    paymentId: number,
    orgId: number,
    data: CreatePaymentAllocationInput
) => {
    const [allocation] = await db
        .insert(paymentAllocations)
        .values({
            paymentId,
            orgId,
            ...data,
        })
        .$returningId();

    return allocation;
};

/**
 * Get payment allocations
 * @param paymentId - Payment ID
 * @param orgId - Organization ID  
 * @returns Array of payment allocations
 */
export const getPaymentAllocations = async (paymentId: number, orgId: number) => {
    return db.query.paymentAllocations.findMany({
        where: and(
            eq(paymentAllocations.paymentId, paymentId),
            eq(paymentAllocations.orgId, orgId)
        ),
    });
};
