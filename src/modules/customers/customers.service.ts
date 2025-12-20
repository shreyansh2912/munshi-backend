/**
 * Customers Module - Service
 * 
 * Business logic for customer operations with:
 * - Duplicate validation (customerCode, GSTIN)
 * - Pagination support
 * - Proper error handling
 * - Soft delete functionality
 * 
 * @module modules/customers/customers.service
 */

import { db } from '@db/mysql/client.js';
import { customers } from '@db/schema';
import { eq, and, or, isNull, desc, asc, like, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { CreateCustomerInput, UpdateCustomerInput } from './customers.validation.js';
import { NotFoundError, AlreadyExistsError, BusinessLogicError } from '@utils/errors.js';
import {
    parsePaginationParams,
    buildPaginatedResponse,
    type PaginationParams,
    type PaginatedResponse,
} from '@utils/pagination.js';

// ============================================================================
// TYPES
// ============================================================================

interface ListCustomersParams extends PaginationParams {
    search?: string;
    isActive?: boolean;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if customer code already exists
 * 
 * @throws {AlreadyExistsError} If customer code is already in use
 */
async function validateCustomerCode(
    orgId: number,
    customerCode: string,
    excludeId?: number
): Promise<void> {
    const existing = await db.query.customers.findFirst({
        where: and(
            eq(customers.orgId, orgId),
            eq(customers.customerCode, customerCode),
            isNull(customers.deletedAt),
            excludeId ? sql`${customers.id} != ${excludeId}` : undefined
        ),
    });

    if (existing) {
        throw new AlreadyExistsError('Customer', 'customerCode', customerCode);
    }
}

/**
 * Check if GSTIN already exists
 * 
 * @throws {AlreadyExistsError} If GSTIN is already in use
 */
async function validateGSTIN(
    orgId: number,
    gstin: string,
    excludeId?: number
): Promise<void> {
    const existing = await db.query.customers.findFirst({
        where: and(
            eq(customers.orgId, orgId),
            eq(customers.gstin, gstin),
            isNull(customers.deletedAt),
            excludeId ? sql`${customers.id} != ${excludeId}` : undefined
        ),
    });

    if (existing) {
        throw new AlreadyExistsError('Customer', 'GSTIN', gstin);
    }
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new customer
 * 
 * Validates uniqueness of customerCode and GSTIN before creating.
 * 
 * @param orgId - Organization ID
 * @param data - Customer data
 * @returns Created customer
 * @throws {AlreadyExistsError} If customerCode or GSTIN already exists
 * 
 * @example
 * ```ts
 * const customer = await createCustomer(orgId, {
 *   name: 'Acme Corp',
 *   customerCode: 'CUST001',
 *   gstin: '27AAAAA0000A1Z5'
 * });
 * ```
 */
export const createCustomer = async (orgId: number, data: CreateCustomerInput) => {
    // Validate unique customer code
    if (data.customerCode) {
        await validateCustomerCode(orgId, data.customerCode);
    }

    // Validate unique GSTIN
    if (data.gstin) {
        await validateGSTIN(orgId, data.gstin);
    }

    // Create customer
    const [customer] = await db
        .insert(customers)
        .values({
            orgId,
            uuid: uuidv4(),
            ...data,
        })
        .$returningId();

    return getCustomer(customer.id.toString(), orgId);
};

// ============================================================================
// READ
// ============================================================================

/**
 * Get customer by ID
 * 
 * @param id - Customer ID
 * @param orgId - Organization ID
 * @returns Customer data
 * @throws {NotFoundError} If customer not found
 */
export const getCustomer = async (id: string, orgId: number) => {
    const customer = await db.query.customers.findFirst({
        where: and(
            eq(customers.id, parseInt(id)),
            eq(customers.orgId, orgId),
            isNull(customers.deletedAt)
        ),
    });

    if (!customer) {
        throw new NotFoundError('Customer', id);
    }

    return customer;
};

/**
 * List customers with pagination and filtering
 * 
 * @param orgId - Organization ID
 * @param params - Query parameters (page, limit, search, etc.)
 * @returns Paginated customer list
 * 
 * @example
 * ```ts
 * const result = await listCustomers(orgId, {
 *   page: 1,
 *   limit: 20,
 *   search: 'acme',
 *   isActive: true
 * });
 * ```
 */
export const listCustomers = async (
    orgId: number,
    params: ListCustomersParams = {}
): Promise<PaginatedResponse<typeof customers.$inferSelect>> => {
    const options = parsePaginationParams(params);

    // Build where conditions
    const conditions = [
        eq(customers.orgId, orgId),
        isNull(customers.deletedAt),
    ];

    // Add search filter
    if (params.search) {
        conditions.push(
            or(
                like(customers.name, `%${params.search}%`),
                like(customers.customerCode, `%${params.search}%`),
                like(customers.email, `%${params.search}%`)
            )!
        );
    }

    // Add active filter
    if (params.isActive !== undefined) {
        conditions.push(eq(customers.isActive, params.isActive));
    }

    // Get total count
    const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(and(...conditions));

    // Get paginated data
    const data = await db
        .select()
        .from(customers)
        .where(and(...conditions))
        .orderBy(options.order === 'asc' ? asc(customers.createdAt) : desc(customers.createdAt))
        .limit(options.limit)
        .offset(options.offset);

    return buildPaginatedResponse(data, count, options);
};

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update customer
 * 
 * Validates uniqueness of customerCode and GSTIN if changed.
 * 
 * @param id - Customer ID
 * @param orgId - Organization ID
 * @param data - Updated customer data
 * @returns Updated customer
 * @throws {NotFoundError} If customer not found
 * @throws {AlreadyExistsError} If customerCode or GSTIN already exists
 */
export const updateCustomer = async (
    id: string,
    orgId: number,
    data: UpdateCustomerInput
) => {
    const customerId = parseInt(id);

    // Verify customer exists
    await getCustomer(id, orgId);

    // Validate unique customer code if being updated
    if (data.customerCode) {
        await validateCustomerCode(orgId, data.customerCode, customerId);
    }

    // Validate unique GSTIN if being updated
    if (data.gstin) {
        await validateGSTIN(orgId, data.gstin, customerId);
    }

    // Update customer
    const [updated] = await db
        .update(customers)
        .set(data)
        .where(and(
            eq(customers.id, customerId),
            eq(customers.orgId, orgId),
            isNull(customers.deletedAt)
        ))
        .$returningId();

    if (!updated) {
        throw new NotFoundError('Customer', id);
    }

    return getCustomer(id, orgId);
};

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete customer (soft delete)
 * 
 * Marks customer as deleted without removing from database.
 * 
 * @param id - Customer ID
 * @param orgId - Organization ID
 * @returns Success status
 * @throws {NotFoundError} If customer not found
 */
export const deleteCustomer = async (id: string, orgId: number) => {
    const [deleted] = await db
        .update(customers)
        .set({ deletedAt: new Date() })
        .where(and(
            eq(customers.id, parseInt(id)),
            eq(customers.orgId, orgId),
            isNull(customers.deletedAt)
        ))
        .$returningId();

    if (!deleted) {
        throw new NotFoundError('Customer', id);
    }

    return true;
};
