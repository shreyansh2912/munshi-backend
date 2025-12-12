/**
 * Materialized Views Schema - Reporting Tables
 */

import {
    mysqlTable,
    bigint,
    char,
    varchar,
    datetime,
    date,
    mysqlEnum,
    int,
    index,
    uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { organizations } from './core';
import { accounts } from './accounting';
import { customers } from './parties';
import { invoices } from './invoicing';
import { productVariants, stockLocations } from './inventory';

/**
 * Trial Balance Materialized View
 */
export const mvTrialBalance = mysqlTable(
    'mv_trial_balance',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        accountId: bigint('account_id', { mode: 'number' }).notNull(),
        accountCode: varchar('account_code', { length: 50 }),
        accountName: varchar('account_name', { length: 255 }),
        accountType: mysqlEnum('account_type', ['asset', 'liability', 'equity', 'income', 'expense', 'contra']),
        debitBalance: bigint('debit_balance', { mode: 'number' }).default(0),
        creditBalance: bigint('credit_balance', { mode: 'number' }).default(0),
        netBalance: bigint('net_balance', { mode: 'number' }).default(0),
        periodStart: date('period_start', { mode: 'date' }).notNull(),
        periodEnd: date('period_end', { mode: 'date' }).notNull(),
        lastRefreshedAt: datetime('last_refreshed_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        uniqueOrgAccountPeriod: uniqueIndex('unique_org_account_period').on(table.orgId, table.accountId, table.periodStart, table.periodEnd),
        orgPeriodIdx: index('idx_org_period').on(table.orgId, table.periodStart, table.periodEnd),
        orgTypeIdx: index('idx_org_type').on(table.orgId, table.accountType),
    })
);

/**
 * Profit & Loss Materialized View
 */
export const mvProfitLoss = mysqlTable(
    'mv_profit_loss',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        accountId: bigint('account_id', { mode: 'number' }).notNull(),
        accountCode: varchar('account_code', { length: 50 }),
        accountName: varchar('account_name', { length: 255 }),
        accountType: mysqlEnum('account_type', ['income', 'expense']),
        amount: bigint('amount', { mode: 'number' }).default(0),
        periodStart: date('period_start', { mode: 'date' }).notNull(),
        periodEnd: date('period_end', { mode: 'date' }).notNull(),
        lastRefreshedAt: datetime('last_refreshed_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        uniqueOrgAccountPeriod: uniqueIndex('unique_org_account_period').on(table.orgId, table.accountId, table.periodStart, table.periodEnd),
        orgPeriodIdx: index('idx_org_period').on(table.orgId, table.periodStart, table.periodEnd),
        orgTypeIdx: index('idx_org_type').on(table.orgId, table.accountType),
    })
);

/**
 * Balance Sheet Materialized View
 */
export const mvBalanceSheet = mysqlTable(
    'mv_balance_sheet',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        accountId: bigint('account_id', { mode: 'number' }).notNull(),
        accountCode: varchar('account_code', { length: 50 }),
        accountName: varchar('account_name', { length: 255 }),
        accountType: mysqlEnum('account_type', ['asset', 'liability', 'equity']),
        amount: bigint('amount', { mode: 'number' }).default(0),
        asOfDate: date('as_of_date', { mode: 'date' }).notNull(),
        lastRefreshedAt: datetime('last_refreshed_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        uniqueOrgAccountDate: uniqueIndex('unique_org_account_date').on(table.orgId, table.accountId, table.asOfDate),
        orgDateIdx: index('idx_org_date').on(table.orgId, table.asOfDate),
        orgTypeIdx: index('idx_org_type').on(table.orgId, table.accountType),
    })
);

/**
 * AR Aging Materialized View
 */
export const mvArAging = mysqlTable(
    'mv_ar_aging',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        customerId: bigint('customer_id', { mode: 'number' }).notNull(),
        customerName: varchar('customer_name', { length: 255 }),
        invoiceId: bigint('invoice_id', { mode: 'number' }).notNull(),
        invoiceNumber: varchar('invoice_number', { length: 100 }),
        invoiceDate: date('invoice_date', { mode: 'date' }),
        dueDate: date('due_date', { mode: 'date' }),
        daysOverdue: int('days_overdue'),
        agingBucket: mysqlEnum('aging_bucket', ['current', '1-30', '31-60', '61-90', '90+']),
        invoiceAmount: bigint('invoice_amount', { mode: 'number' }),
        amountPaid: bigint('amount_paid', { mode: 'number' }),
        balanceDue: bigint('balance_due', { mode: 'number' }),
        asOfDate: date('as_of_date', { mode: 'date' }).notNull(),
        lastRefreshedAt: datetime('last_refreshed_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        orgDateIdx: index('idx_org_date').on(table.orgId, table.asOfDate),
        orgCustomerIdx: index('idx_org_customer').on(table.orgId, table.customerId),
        orgBucketIdx: index('idx_org_bucket').on(table.orgId, table.agingBucket),
    })
);

/**
 * Stock Valuation Materialized View
 */
export const mvStockValuation = mysqlTable(
    'mv_stock_valuation',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        productVariantId: bigint('product_variant_id', { mode: 'number' }).notNull(),
        productName: varchar('product_name', { length: 255 }),
        variantSku: varchar('variant_sku', { length: 100 }),
        locationId: bigint('location_id', { mode: 'number' }).notNull(),
        locationName: varchar('location_name', { length: 255 }),
        quantity: bigint('quantity', { mode: 'number' }),
        averageCost: bigint('average_cost', { mode: 'number' }),
        totalValue: bigint('total_value', { mode: 'number' }),
        asOfDate: date('as_of_date', { mode: 'date' }).notNull(),
        lastRefreshedAt: datetime('last_refreshed_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        uniqueOrgVariantLocationDate: uniqueIndex('unique_org_variant_location_date').on(table.orgId, table.productVariantId, table.locationId, table.asOfDate),
        orgDateIdx: index('idx_org_date').on(table.orgId, table.asOfDate),
        orgLocationIdx: index('idx_org_location').on(table.orgId, table.locationId),
    })
);

/**
 * Relations
 */
export const mvTrialBalanceRelations = relations(mvTrialBalance, ({ one }) => ({
    organization: one(organizations, {
        fields: [mvTrialBalance.orgId],
        references: [organizations.id],
    }),
    account: one(accounts, {
        fields: [mvTrialBalance.accountId],
        references: [accounts.id],
    }),
}));

export const mvProfitLossRelations = relations(mvProfitLoss, ({ one }) => ({
    organization: one(organizations, {
        fields: [mvProfitLoss.orgId],
        references: [organizations.id],
    }),
    account: one(accounts, {
        fields: [mvProfitLoss.accountId],
        references: [accounts.id],
    }),
}));

export const mvBalanceSheetRelations = relations(mvBalanceSheet, ({ one }) => ({
    organization: one(organizations, {
        fields: [mvBalanceSheet.orgId],
        references: [organizations.id],
    }),
    account: one(accounts, {
        fields: [mvBalanceSheet.accountId],
        references: [accounts.id],
    }),
}));

export const mvArAgingRelations = relations(mvArAging, ({ one }) => ({
    organization: one(organizations, {
        fields: [mvArAging.orgId],
        references: [organizations.id],
    }),
    customer: one(customers, {
        fields: [mvArAging.customerId],
        references: [customers.id],
    }),
    invoice: one(invoices, {
        fields: [mvArAging.invoiceId],
        references: [invoices.id],
    }),
}));

export const mvStockValuationRelations = relations(mvStockValuation, ({ one }) => ({
    organization: one(organizations, {
        fields: [mvStockValuation.orgId],
        references: [organizations.id],
    }),
    productVariant: one(productVariants, {
        fields: [mvStockValuation.productVariantId],
        references: [productVariants.id],
    }),
    location: one(stockLocations, {
        fields: [mvStockValuation.locationId],
        references: [stockLocations.id],
    }),
}));
