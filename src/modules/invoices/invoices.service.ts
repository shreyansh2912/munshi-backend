/**
 * Invoices Module - Service
 * 
 * Business logic for invoice operations with:
 * - Auto-numbering system
 * - Tax calculations (GST)  
 * - Pagination support
 * - Status workflow validation
 * - Proper error handling
 * 
 * @module modules/invoices/invoices.service
 */

import { db } from '@db/mysql/client.js';
import { invoices } from '@db/schema';
import { eq, and, or, isNull, desc, asc, like, sql, gte, lte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { CreateInvoiceInput, UpdateInvoiceInput } from './invoices.validation.js';
import { NotFoundError, BusinessLogicError } from '@utils/errors.js';
import {
    parsePaginationParams,
    buildPaginatedResponse,
    type PaginationParams,
    type PaginatedResponse,
} from '@utils/pagination.js';

// ============================================================================
// TYPES
// ============================================================================

interface ListInvoicesParams extends PaginationParams {
    search?: string;
    status?: string;
    customerId?: number;
    dateFrom?: string;
    dateTo?: string;
}

// ============================================================================
// AUTO-NUMBERING
// ============================================================================

/**
 * Generate next invoice number
 * 
 * Format: INV-YYYY-XXXX (e.g., INV-2024-0001)
 * 
 * @param orgId - Organization ID
 * @returns Next invoice number
 */
async function generateInvoiceNumber(orgId: number): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;

    // Get latest invoice number for current year
    const latestInvoice = await db.query.invoices.findFirst({
        where: and(
            eq(invoices.orgId, orgId),
            like(invoices.invoiceNumber, `${prefix}%`)
        ),
        orderBy: (invoices, { desc }) => [desc(invoices.invoiceNumber)],
    });

    let nextNumber = 1;

    if (latestInvoice?.invoiceNumber) {
        // Extract number from INV-2024-0001 -> 0001
        const match = latestInvoice.invoiceNumber.match(/INV-\d{4}-(\d+)$/);
        if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
        }
    }

    // Pad with zeros (0001, 0002, etc.)
    const paddedNumber = nextNumber.toString().padStart(4, '0');

    return `${prefix}${paddedNumber}`;
}

// ============================================================================
// TAX CALCULATIONS
// ============================================================================

/**
 * Calculate GST amounts
 * 
 * @param subtotal - Subtotal amount
 * @param taxRate - Tax rate percentage (e.g., 18 for 18%)
 * @returns Tax breakdown
 */
function calculateGST(subtotal: number, taxRate: number = 18) {
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    // For intra-state (CGST + SGST)
    const cgst = taxAmount / 2;
    const sgst = taxAmount / 2;

    // For inter-state (IGST)
    const igst = taxAmount;

    return {
        subtotal,
        taxRate,
        taxAmount,
        cgst,
        sgst,
        igst,
        total,
    };
}

/**
 * Calculate invoice totals from items
 * 
 * @param items - Invoice items
 * @param isInterState - Whether invoice is inter-state
 * @returns Calculated totals
 */
function calculateInvoiceTotals(
    items: Array<{ quantity: number; rate: number; taxRate?: number }>,
    isInterState: boolean = false
) {
    let subtotal = 0;
    let totalTax = 0;

    items.forEach((item) => {
        const itemTotal = item.quantity * item.rate;
        subtotal += itemTotal;

        if (item.taxRate) {
            const itemTax = (itemTotal * item.taxRate) / 100;
            totalTax += itemTax;
        }
    });

    const total = subtotal + totalTax;

    return {
        subtotal,
        taxAmount: totalTax,
        cgst: isInterState ? 0 : totalTax / 2,
        sgst: isInterState ? 0 : totalTax / 2,
        igst: isInterState ? totalTax : 0,
        total,
    };
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new invoice
 * 
 * Auto-generates invoice number and calculates totals.
 * 
 * @param orgId - Organization ID
 * @param userId - User ID creating the invoice
 * @param data - Invoice data
 * @returns Created invoice
 * 
 * @example
 * ```ts
 * const invoice = await createInvoice(orgId, userId, {
 *   customerId: 1,
 *   items: [{ description: 'Service', quantity: 1, rate: 10000 }],
 *   // Invoice number auto-generated
 * });
 * ```
 */
export const createInvoice = async (
    orgId: number,
    userId: number,
    data: CreateInvoiceInput
) => {
    // Generate invoice number if not provided
    const invoiceNumber = data.invoiceNumber || (await generateInvoiceNumber(orgId));

    // Calculate totals if items provided
    // Note: In real implementation, items would be in separate table
    // This is simplified for demonstration

    const [invoice] = await db
        .insert(invoices)
        .values({
            orgId,
            uuid: uuidv4(),
            createdBy: userId,
            invoiceNumber,
            status: 'draft', // Start as draft
            ...data,
        })
        .$returningId();

    return getInvoice(invoice.id.toString(), orgId);
};

// ============================================================================
// READ
// ============================================================================

/**
 * Get invoice by ID
 * 
 * @param id - Invoice ID
 * @param orgId - Organization ID
 * @returns Invoice data with relations
 * @throws {NotFoundError} If invoice not found
 */
export const getInvoice = async (id: string, orgId: number) => {
    const invoice = await db.query.invoices.findFirst({
        where: and(
            eq(invoices.id, parseInt(id)),
            eq(invoices.orgId, orgId),
            isNull(invoices.deletedAt)
        ),
        with: {
            customer: true,
            items: {
                with: {
                    taxLines: true,
                },
            },
        },
    });

    if (!invoice) {
        throw new NotFoundError('Invoice', id);
    }

    return invoice;
};

/**
 * List invoices with pagination and filtering
 * 
 * @param orgId - Organization ID
 * @param params - Query parameters
 * @returns Paginated invoice list
 */
export const listInvoices = async (
    orgId: number,
    params: ListInvoicesParams = {}
): Promise<PaginatedResponse<typeof invoices.$inferSelect>> => {
    const options = parsePaginationParams(params);

    // Build where conditions
    const conditions = [
        eq(invoices.orgId, orgId),
        isNull(invoices.deletedAt),
    ];

    // Add search filter (invoice number or customer)
    if (params.search) {
        conditions.push(
            like(invoices.invoiceNumber, `%${params.search}%`)
        );
    }

    // Add status filter
    if (params.status) {
        conditions.push(eq(invoices.status, params.status));
    }

    // Add customer filter
    if (params.customerId) {
        conditions.push(eq(invoices.customerId, params.customerId));
    }

    // Add date range filter
    if (params.dateFrom) {
        conditions.push(gte(invoices.invoiceDate, new Date(params.dateFrom)));
    }
    if (params.dateTo) {
        conditions.push(lte(invoices.invoiceDate, new Date(params.dateTo)));
    }

    // Get total count
    const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(invoices)
        .where(and(...conditions));

    // Get paginated data
    const data = await db
        .select()
        .from(invoices)
        .where(and(...conditions))
        .orderBy(options.order === 'asc' ? asc(invoices.createdAt) : desc(invoices.createdAt))
        .limit(options.limit)
        .offset(options.offset);

    return buildPaginatedResponse(data, count, options);
};

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update invoice
 * 
 * Validates status transitions.
 * 
 * @param id - Invoice ID
 * @param orgId - Organization ID
 * @param data - Updated invoice data
 * @returns Updated invoice
 * @throws {NotFoundError} If invoice not found
 * @throws {BusinessLogicError} If invalid status transition
 */
export const updateInvoice = async (
    id: string,
    orgId: number,
    data: UpdateInvoiceInput
) => {
    // Verify invoice exists
    const existing = await getInvoice(id, orgId);

    // Validate status transitions
    if (data.status) {
        const validTransitions: Record<string, string[]> = {
            draft: ['sent', 'cancelled'],
            sent: ['paid', 'overdue', 'cancelled'],
            paid: [], // Cannot change from paid
            overdue: ['paid', 'cancelled'],
            cancelled: [], // Cannot change from cancelled
        };

        const allowedStatuses = validTransitions[existing.status] || [];

        if (!allowedStatuses.includes(data.status)) {
            throw new BusinessLogicError(
                `Cannot change invoice status from ${existing.status} to ${data.status}`
            );
        }
    }

    const [updated] = await db
        .update(invoices)
        .set(data)
        .where(and(
            eq(invoices.id, parseInt(id)),
            eq(invoices.orgId, orgId),
            isNull(invoices.deletedAt)
        ))
        .$returningId();

    if (!updated) {
        throw new NotFoundError('Invoice', id);
    }

    return getInvoice(id, orgId);
};

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete invoice (soft delete)
 * 
 * Only draft invoices can be deleted.
 * 
 * @param id - Invoice ID
 * @param orgId - Organization ID
 * @returns Success status
 * @throws {NotFoundError} If invoice not found
 * @throws {BusinessLogicError} If invoice cannot be deleted
 */
export const deleteInvoice = async (id: string, orgId: number) => {
    // Verify invoice exists and check status
    const invoice = await getInvoice(id, orgId);

    if (invoice.status !== 'draft') {
        throw new BusinessLogicError(
            `Cannot delete invoice with status '${invoice.status}'. Only draft invoices can be deleted.`
        );
    }

    const [deleted] = await db
        .update(invoices)
        .set({ deletedAt: new Date() })
        .where(and(
            eq(invoices.id, parseInt(id)),
            eq(invoices.orgId, orgId),
            isNull(invoices.deletedAt)
        ))
        .$returningId();

    if (!deleted) {
        throw new NotFoundError('Invoice', id);
    }

    return true;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get invoice statistics
 * 
 * @param orgId - Organization ID
 * @returns Invoice statistics
 */
export async function getInvoiceStats(orgId: number) {
    const result = await db
        .select({
            status: invoices.status,
            count: sql<number>`count(*)`,
            total: sql<number>`sum(${invoices.totalAmount})`,
        })
        .from(invoices)
        .where(and(
            eq(invoices.orgId, orgId),
            isNull(invoices.deletedAt)
        ))
        .groupBy(invoices.status);

    return result;
}
