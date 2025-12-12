/**
 * Party Tables Schema - Customers & Suppliers
 */

import {
    mysqlTable,
    bigint,
    char,
    varchar,
    boolean,
    datetime,
    text,
    json,
    int,
    index,
    uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { organizations } from './core';
import { accounts } from './accounting';

/**
 * Customers table
 */
export const customers = mysqlTable(
    'customers',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        uuid: char('uuid', { length: 36 }).notNull().unique(),
        customerCode: varchar('customer_code', { length: 50 }),
        name: varchar('name', { length: 255 }).notNull(),
        legalName: varchar('legal_name', { length: 255 }),
        gstin: varchar('gstin', { length: 15 }),
        pan: varchar('pan', { length: 10 }),
        contactPerson: varchar('contact_person', { length: 200 }),
        email: varchar('email', { length: 255 }),
        phone: varchar('phone', { length: 32 }),
        billingAddressLine1: varchar('billing_address_line1', { length: 255 }),
        billingAddressLine2: varchar('billing_address_line2', { length: 255 }),
        billingCity: varchar('billing_city', { length: 100 }),
        billingState: varchar('billing_state', { length: 100 }),
        billingPincode: varchar('billing_pincode', { length: 10 }),
        billingCountry: char('billing_country', { length: 2 }).default('IN'),
        shippingAddressLine1: varchar('shipping_address_line1', { length: 255 }),
        shippingAddressLine2: varchar('shipping_address_line2', { length: 255 }),
        shippingCity: varchar('shipping_city', { length: 100 }),
        shippingState: varchar('shipping_state', { length: 100 }),
        shippingPincode: varchar('shipping_pincode', { length: 10 }),
        shippingCountry: char('shipping_country', { length: 2 }).default('IN'),
        creditLimit: bigint('credit_limit', { mode: 'number' }).default(0),
        paymentTermsDays: int('payment_terms_days').default(30),
        accountId: bigint('account_id', { mode: 'number' }),
        isActive: boolean('is_active').default(true),
        meta: json('meta'),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
        deletedAt: datetime('deleted_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        uniqueOrgCode: uniqueIndex('unique_org_code').on(table.orgId, table.customerCode),
        orgNameIdx: index('idx_org_name').on(table.orgId, table.name),
        orgGstinIdx: index('idx_org_gstin').on(table.orgId, table.gstin),
        uuidIdx: index('idx_uuid').on(table.uuid),
    })
);

/**
 * Suppliers table
 */
export const suppliers = mysqlTable(
    'suppliers',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        uuid: char('uuid', { length: 36 }).notNull().unique(),
        supplierCode: varchar('supplier_code', { length: 50 }),
        name: varchar('name', { length: 255 }).notNull(),
        legalName: varchar('legal_name', { length: 255 }),
        gstin: varchar('gstin', { length: 15 }),
        pan: varchar('pan', { length: 10 }),
        contactPerson: varchar('contact_person', { length: 200 }),
        email: varchar('email', { length: 255 }),
        phone: varchar('phone', { length: 32 }),
        addressLine1: varchar('address_line1', { length: 255 }),
        addressLine2: varchar('address_line2', { length: 255 }),
        city: varchar('city', { length: 100 }),
        state: varchar('state', { length: 100 }),
        pincode: varchar('pincode', { length: 10 }),
        country: char('country', { length: 2 }).default('IN'),
        paymentTermsDays: int('payment_terms_days').default(30),
        accountId: bigint('account_id', { mode: 'number' }),
        isActive: boolean('is_active').default(true),
        meta: json('meta'),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
        deletedAt: datetime('deleted_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        uniqueOrgCode: uniqueIndex('unique_org_code').on(table.orgId, table.supplierCode),
        orgNameIdx: index('idx_org_name').on(table.orgId, table.name),
        orgGstinIdx: index('idx_org_gstin').on(table.orgId, table.gstin),
        uuidIdx: index('idx_uuid').on(table.uuid),
    })
);

/**
 * Relations
 */
export const customersRelations = relations(customers, ({ one }) => ({
    organization: one(organizations, {
        fields: [customers.orgId],
        references: [organizations.id],
    }),
    account: one(accounts, {
        fields: [customers.accountId],
        references: [accounts.id],
    }),
}));

export const suppliersRelations = relations(suppliers, ({ one }) => ({
    organization: one(organizations, {
        fields: [suppliers.orgId],
        references: [organizations.id],
    }),
    account: one(accounts, {
        fields: [suppliers.accountId],
        references: [accounts.id],
    }),
}));
