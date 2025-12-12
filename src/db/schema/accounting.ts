/**
 * Accounting Tables Schema - Double-Entry Bookkeeping
 * Chart of Accounts, Ledger Accounts, Journal Entries
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
    tinyint,
    smallint,
    index,
    uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { organizations, users } from './core';

/**
 * Chart of Accounts - Account templates/master
 */
export const chartOfAccounts = mysqlTable(
    'chart_of_accounts',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        code: varchar('code', { length: 50 }).notNull(),
        name: varchar('name', { length: 255 }).notNull(),
        accountType: mysqlEnum('account_type', ['asset', 'liability', 'equity', 'income', 'expense', 'contra']).notNull(),
        accountSubtype: varchar('account_subtype', { length: 100 }),
        parentId: bigint('parent_id', { mode: 'number' }),
        level: tinyint('level').default(0),
        normalBalance: mysqlEnum('normal_balance', ['debit', 'credit']).notNull(),
        isSystem: boolean('is_system').default(false),
        isActive: boolean('is_active').default(true),
        description: text('description'),
        meta: json('meta'),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
        deletedAt: datetime('deleted_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        uniqueOrgCode: uniqueIndex('unique_org_code').on(table.orgId, table.code),
        orgTypeIdx: index('idx_org_type').on(table.orgId, table.accountType),
        orgParentIdx: index('idx_org_parent').on(table.orgId, table.parentId),
        orgActiveIdx: index('idx_org_active').on(table.orgId, table.isActive),
    })
);

/**
 * Accounts - Ledger accounts with balances
 */
export const accounts = mysqlTable(
    'accounts',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        uuid: char('uuid', { length: 36 }).notNull().unique(),
        coaId: bigint('coa_id', { mode: 'number' }).notNull(),
        name: varchar('name', { length: 255 }).notNull(),
        code: varchar('code', { length: 50 }),
        openingBalance: bigint('opening_balance', { mode: 'number' }).default(0),
        openingBalanceDate: date('opening_balance_date', { mode: 'date' }),
        currentBalance: bigint('current_balance', { mode: 'number' }).default(0),
        currency: char('currency', { length: 3 }).default('INR'),
        isReconcilable: boolean('is_reconcilable').default(false),
        isActive: boolean('is_active').default(true),
        version: int('version').default(0),
        meta: json('meta'),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
        deletedAt: datetime('deleted_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        orgCoaIdx: index('idx_org_coa').on(table.orgId, table.coaId),
        orgActiveIdx: index('idx_org_active').on(table.orgId, table.isActive),
        uuidIdx: index('idx_uuid').on(table.uuid),
    })
);

/**
 * Journal Entries - Transaction headers
 */
export const journalEntries = mysqlTable(
    'journal_entries',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        uuid: char('uuid', { length: 36 }).notNull().unique(),
        entryNumber: varchar('entry_number', { length: 100 }),
        entryDate: date('entry_date', { mode: 'date' }).notNull(),
        entryType: mysqlEnum('entry_type', ['manual', 'invoice', 'payment', 'bank_sync', 'adjustment', 'opening', 'closing']).default('manual'),
        narration: text('narration'),
        referenceType: varchar('reference_type', { length: 50 }),
        referenceId: char('reference_id', { length: 36 }),
        referenceNumber: varchar('reference_number', { length: 100 }),
        status: mysqlEnum('status', ['draft', 'posted', 'reversed', 'void']).default('draft'),
        postedAt: datetime('posted_at', { mode: 'date', fsp: 6 }),
        postedBy: char('posted_by', { length: 36 }),
        reversedAt: datetime('reversed_at', { mode: 'date', fsp: 6 }),
        reversedBy: char('reversed_by', { length: 36 }),
        reversalOfId: bigint('reversal_of_id', { mode: 'number' }),
        createdBy: char('created_by', { length: 36 }).notNull(),
        version: int('version').default(0),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
    },
    (table) => ({
        orgDateIdx: index('idx_org_date').on(table.orgId, table.entryDate),
        orgStatusIdx: index('idx_org_status').on(table.orgId, table.status),
        orgTypeIdx: index('idx_org_type').on(table.orgId, table.entryType),
        referenceIdx: index('idx_reference').on(table.orgId, table.referenceType, table.referenceId),
        uuidIdx: index('idx_uuid').on(table.uuid),
    })
);

/**
 * Journal Lines - Debit/Credit entries
 */
export const journalLines = mysqlTable(
    'journal_lines',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        journalEntryId: bigint('journal_entry_id', { mode: 'number' }).notNull(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        accountId: bigint('account_id', { mode: 'number' }).notNull(),
        lineNumber: smallint('line_number').notNull(),
        amount: bigint('amount', { mode: 'number' }).notNull(),
        dc: mysqlEnum('dc', ['debit', 'credit']).notNull(),
        description: text('description'),
        taxComponents: json('tax_components').$type<{ cgst?: number; sgst?: number; igst?: number }>(),
        costCenterId: bigint('cost_center_id', { mode: 'number' }),
        projectId: bigint('project_id', { mode: 'number' }),
        meta: json('meta'),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
    },
    (table) => ({
        journalEntryIdx: index('idx_journal_entry').on(table.journalEntryId),
        orgAccountIdx: index('idx_org_account').on(table.orgId, table.accountId),
    })
);

/**
 * Account Balances - Cached balances for performance
 */
export const accountBalances = mysqlTable(
    'account_balances',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        accountId: bigint('account_id', { mode: 'number' }).notNull(),
        balance: bigint('balance', { mode: 'number' }).notNull().default(0),
        lastEntryId: bigint('last_entry_id', { mode: 'number' }),
        lastUpdatedAt: datetime('last_updated_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        uniqueOrgAccount: uniqueIndex('unique_org_account').on(table.orgId, table.accountId),
        orgIdIdx: index('idx_org_id').on(table.orgId),
    })
);

/**
 * Relations
 */
export const chartOfAccountsRelations = relations(chartOfAccounts, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [chartOfAccounts.orgId],
        references: [organizations.id],
    }),
    parent: one(chartOfAccounts, {
        fields: [chartOfAccounts.parentId],
        references: [chartOfAccounts.id],
        relationName: 'chartHierarchy',
    }),
    children: many(chartOfAccounts, {
        relationName: 'chartHierarchy',
    }),
    accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [accounts.orgId],
        references: [organizations.id],
    }),
    chartOfAccount: one(chartOfAccounts, {
        fields: [accounts.coaId],
        references: [chartOfAccounts.id],
    }),
    journalLines: many(journalLines),
    balance: one(accountBalances),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [journalEntries.orgId],
        references: [organizations.id],
    }),
    creator: one(users, {
        fields: [journalEntries.createdBy],
        references: [users.id],
    }),
    poster: one(users, {
        fields: [journalEntries.postedBy],
        references: [users.id],
    }),
    reverser: one(users, {
        fields: [journalEntries.reversedBy],
        references: [users.id],
    }),
    reversalOf: one(journalEntries, {
        fields: [journalEntries.reversalOfId],
        references: [journalEntries.id],
        relationName: 'reversals',
    }),
    reversals: many(journalEntries, {
        relationName: 'reversals',
    }),
    lines: many(journalLines),
}));

export const journalLinesRelations = relations(journalLines, ({ one }) => ({
    organization: one(organizations, {
        fields: [journalLines.orgId],
        references: [organizations.id],
    }),
    journalEntry: one(journalEntries, {
        fields: [journalLines.journalEntryId],
        references: [journalEntries.id],
    }),
    account: one(accounts, {
        fields: [journalLines.accountId],
        references: [accounts.id],
    }),
}));

export const accountBalancesRelations = relations(accountBalances, ({ one }) => ({
    organization: one(organizations, {
        fields: [accountBalances.orgId],
        references: [organizations.id],
    }),
    account: one(accounts, {
        fields: [accountBalances.accountId],
        references: [accounts.id],
    }),
}));
