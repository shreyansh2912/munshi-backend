/**
 * Customers Module - Service
 * Business logic for customer operations
 */

import { db } from '@db/mysql/client.js';
import { customers } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError } from '@utils/errors.js';
import type { CreateCustomerInput, UpdateCustomerInput } from './customers.validation.js';

/**
 * Create a new customer
 */
export const createCustomer = async (orgId: number, data: CreateCustomerInput) => {
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

/**
 * Get customer by ID
 */
export const getCustomer = async (id: string, orgId: number) => {
    const customer = await db.query.customers.findFirst({
        where: and(eq(customers.id, parseInt(id)), eq(customers.orgId, orgId)),
    });

    if (!customer) {
        throw new NotFoundError('Customer not found');
    }

    return customer;
};

/**
 * List all customers for an organization
 */
export const listCustomers = async (orgId: number) => {
    return db.query.customers.findMany({
        where: eq(customers.orgId, orgId),
        orderBy: (customers, { desc }) => [desc(customers.createdAt)],
    });
};

/**
 * Update customer
 */
export const updateCustomer = async (id: string, orgId: number, data: UpdateCustomerInput) => {
    const [updated] = await db
        .update(customers)
        .set(data)
        .where(and(eq(customers.id, parseInt(id)), eq(customers.orgId, orgId)))
        .$returningId();

    if (!updated) {
        throw new NotFoundError('Customer not found');
    }

    return getCustomer(id, orgId);
};

/**
 * Delete customer (soft delete)
 */
export const deleteCustomer = async (id: string, orgId: number) => {
    const [deleted] = await db
        .update(customers)
        .set({ deletedAt: new Date() })
        .where(and(eq(customers.id, parseInt(id)), eq(customers.orgId, orgId)))
        .$returningId();

    if (!deleted) {
        throw new NotFoundError('Customer not found');
    }

    return true;
};
