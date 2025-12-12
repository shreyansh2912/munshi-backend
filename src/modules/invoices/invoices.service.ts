/**
 * Invoices Module - Service
 */

import { db } from '@db/mysql/client.js';
import { invoices } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { CreateInvoiceInput, UpdateInvoiceInput } from './invoices.validation.js';
import { NotFoundError } from '@helpers/errors.js';

export const createInvoice = async (orgId: number, userId: number, data: CreateInvoiceInput) => {
    const [invoice] = await db
        .insert(invoices)
        .values({
            orgId,
            uuid: uuidv4(),
            createdBy: userId,
            ...data,
        })
        .$returningId();

    return getInvoice(invoice.id.toString(), orgId);
};

export const getInvoice = async (id: string, orgId: number) => {
    const invoice = await db.query.invoices.findFirst({
        where: and(eq(invoices.id, parseInt(id)), eq(invoices.orgId, orgId)),
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
        throw new NotFoundError('Invoice not found');
    }

    return invoice;
};

export const listInvoices = async (orgId: number) => {
    return db.query.invoices.findMany({
        where: eq(invoices.orgId, orgId),
        with: {
            customer: true,
        },
        orderBy: (invoices, { desc }) => [desc(invoices.createdAt)],
    });
};

export const updateInvoice = async (id: string, orgId: number, data: UpdateInvoiceInput) => {
    const [updated] = await db
        .update(invoices)
        .set(data)
        .where(and(eq(invoices.id, parseInt(id)), eq(invoices.orgId, orgId)))
        .$returningId();

    if (!updated) {
        throw new NotFoundError('Invoice not found');
    }

    return getInvoice(id, orgId);
};

export const deleteInvoice = async (id: string, orgId: number) => {
    const [deleted] = await db
        .update(invoices)
        .set({ deletedAt: new Date() })
        .where(and(eq(invoices.id, parseInt(id)), eq(invoices.orgId, orgId)))
        .$returningId();

    if (!deleted) {
        throw new NotFoundError('Invoice not found');
    }

    return true;
};
