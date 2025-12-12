/**
 * Invoice Tables Schema - Sales Invoices
 */

import {
    mysqlTable,
    bigint,
    char,
    varchar,
    boolean,
    datetime,
    date,
    mysqlEnum,
    text,
    json,
    int,
    smallint,
    decimal,
    index,
    uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { organizations, users } from './core';
import { customers } from './parties';
import { journalEntries } from './accounting';
import { productVariants, units } from './inventory';
import { taxRates } from './inventory';

/**
 * Invoices table
 */
export const invoices = mysqlTable(
    'invoices',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        uuid: char('uuid', { length: 36 }).notNull().unique(),
        invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
        invoiceType: mysqlEnum('invoice_type', ['tax_invoice', 'proforma', 'credit_note', 'debit_note', 'export_invoice']).default('tax_invoice'),
        customerId: bigint('customer_id', { mode: 'number' }).notNull(),
        invoiceDate: date('invoice_date', { mode: 'date' }).notNull(),
        dueDate: date('due_date', { mode: 'date' }),
        placeOfSupply: varchar('place_of_supply', { length: 100 }),
        isReverseCharge: boolean('is_reverse_charge').default(false),
        isExport: boolean('is_export').default(false),
        exportType: mysqlEnum('export_type', ['with_payment', 'without_payment', 'deemed_export']),
        shippingBillNumber: varchar('shipping_bill_number', { length: 100 }),
        shippingBillDate: date('shipping_bill_date', { mode: 'date' }),
        portCode: varchar('port_code', { length: 50 }),
        currency: char('currency', { length: 3 }).default('INR'),
        exchangeRate: decimal('exchange_rate', { precision: 18, scale: 6 }).default('1.000000'),
        subtotal: bigint('subtotal', { mode: 'number' }).notNull().default(0),
        discountAmount: bigint('discount_amount', { mode: 'number' }).default(0),
        taxableAmount: bigint('taxable_amount', { mode: 'number' }).notNull().default(0),
        taxAmount: bigint('tax_amount', { mode: 'number' }).notNull().default(0),
        roundOff: bigint('round_off', { mode: 'number' }).default(0),
        totalAmount: bigint('total_amount', { mode: 'number' }).notNull().default(0),
        amountPaid: bigint('amount_paid', { mode: 'number' }).default(0),
        balanceDue: bigint('balance_due', { mode: 'number' }).default(0),
        status: mysqlEnum('status', ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled', 'void']).default('draft'),
        paymentStatus: mysqlEnum('payment_status', ['unpaid', 'partially_paid', 'paid']).default('unpaid'),
        notes: text('notes'),
        termsAndConditions: text('terms_and_conditions'),
        journalEntryId: bigint('journal_entry_id', { mode: 'number' }),
        version: int('version').default(0),
        createdBy: char('created_by', { length: 36 }).notNull(),
        sentAt: datetime('sent_at', { mode: 'date', fsp: 6 }),
        paidAt: datetime('paid_at', { mode: 'date', fsp: 6 }),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
        deletedAt: datetime('deleted_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        uniqueOrgNumber: uniqueIndex('unique_org_number').on(table.orgId, table.invoiceNumber),
        orgCustomerIdx: index('idx_org_customer').on(table.orgId, table.customerId),
        orgDateIdx: index('idx_org_date').on(table.orgId, table.invoiceDate),
        orgStatusIdx: index('idx_org_status').on(table.orgId, table.status),
        orgPaymentStatusIdx: index('idx_org_payment_status').on(table.orgId, table.paymentStatus),
        dueDateIdx: index('idx_due_date').on(table.orgId, table.dueDate),
        uuidIdx: index('idx_uuid').on(table.uuid),
    })
);

/**
 * Invoice Items table
 */
export const invoiceItems = mysqlTable(
    'invoice_items',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        invoiceId: bigint('invoice_id', { mode: 'number' }).notNull(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        lineNumber: smallint('line_number').notNull(),
        productVariantId: bigint('product_variant_id', { mode: 'number' }),
        description: text('description').notNull(),
        hsnCode: varchar('hsn_code', { length: 50 }),
        sacCode: varchar('sac_code', { length: 50 }),
        quantity: decimal('quantity', { precision: 18, scale: 4 }).notNull(),
        unitId: bigint('unit_id', { mode: 'number' }),
        unitPrice: bigint('unit_price', { mode: 'number' }).notNull(),
        discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0.00'),
        discountAmount: bigint('discount_amount', { mode: 'number' }).default(0),
        taxableAmount: bigint('taxable_amount', { mode: 'number' }).notNull(),
        isTaxInclusive: boolean('is_tax_inclusive').default(false),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
    },
    (table) => ({
        invoiceIdx: index('idx_invoice').on(table.invoiceId),
        orgProductIdx: index('idx_org_product').on(table.orgId, table.productVariantId),
    })
);

/**
 * Invoice Tax Lines table
 */
export const invoiceTaxLines = mysqlTable(
    'invoice_tax_lines',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        invoiceItemId: bigint('invoice_item_id', { mode: 'number' }).notNull(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        taxRateId: bigint('tax_rate_id', { mode: 'number' }).notNull(),
        taxType: mysqlEnum('tax_type', ['CGST', 'SGST', 'IGST', 'CESS', 'TDS', 'TCS']).notNull(),
        taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).notNull(),
        taxableAmount: bigint('taxable_amount', { mode: 'number' }).notNull(),
        taxAmount: bigint('tax_amount', { mode: 'number' }).notNull(),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
    },
    (table) => ({
        invoiceItemIdx: index('idx_invoice_item').on(table.invoiceItemId),
        orgTaxTypeIdx: index('idx_org_tax_type').on(table.orgId, table.taxType),
    })
);

/**
 * Relations
 */
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [invoices.orgId],
        references: [organizations.id],
    }),
    customer: one(customers, {
        fields: [invoices.customerId],
        references: [customers.id],
    }),
    journalEntry: one(journalEntries, {
        fields: [invoices.journalEntryId],
        references: [journalEntries.id],
    }),
    creator: one(users, {
        fields: [invoices.createdBy],
        references: [users.id],
    }),
    items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [invoiceItems.orgId],
        references: [organizations.id],
    }),
    invoice: one(invoices, {
        fields: [invoiceItems.invoiceId],
        references: [invoices.id],
    }),
    productVariant: one(productVariants, {
        fields: [invoiceItems.productVariantId],
        references: [productVariants.id],
    }),
    unit: one(units, {
        fields: [invoiceItems.unitId],
        references: [units.id],
    }),
    taxLines: many(invoiceTaxLines),
}));

export const invoiceTaxLinesRelations = relations(invoiceTaxLines, ({ one }) => ({
    organization: one(organizations, {
        fields: [invoiceTaxLines.orgId],
        references: [organizations.id],
    }),
    invoiceItem: one(invoiceItems, {
        fields: [invoiceTaxLines.invoiceItemId],
        references: [invoiceItems.id],
    }),
    taxRate: one(taxRates, {
        fields: [invoiceTaxLines.taxRateId],
        references: [taxRates.id],
    }),
}));
