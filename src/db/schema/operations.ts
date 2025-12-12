/**
 * Payment, Purchase, Banking, GST, and System Tables Schema
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
    varbinary,
    index,
    uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { organizations, users } from './core';
import { journalEntries, accounts } from './accounting';
import { invoices } from './invoicing';
import { suppliers } from './parties';
import { productVariants, units, taxRates } from './inventory';

/**
 * Payments table
 */
export const payments = mysqlTable(
    'payments',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        uuid: char('uuid', { length: 36 }).notNull().unique(),
        paymentNumber: varchar('payment_number', { length: 100 }).notNull(),
        paymentType: mysqlEnum('payment_type', ['receipt', 'payment']).notNull(),
        paymentDate: date('payment_date', { mode: 'date' }).notNull(),
        partyType: mysqlEnum('party_type', ['customer', 'supplier', 'other']).notNull(),
        partyId: bigint('party_id', { mode: 'number' }).notNull(),
        amount: bigint('amount', { mode: 'number' }).notNull(),
        currency: char('currency', { length: 3 }).default('INR'),
        exchangeRate: decimal('exchange_rate', { precision: 18, scale: 6 }).default('1.000000'),
        paymentMethod: mysqlEnum('payment_method', ['cash', 'bank_transfer', 'upi', 'card', 'cheque', 'dd', 'other']).notNull(),
        bankAccountId: bigint('bank_account_id', { mode: 'number' }),
        referenceNumber: varchar('reference_number', { length: 255 }),
        chequeNumber: varchar('cheque_number', { length: 100 }),
        chequeDate: date('cheque_date', { mode: 'date' }),
        upiTransactionId: varchar('upi_transaction_id', { length: 255 }),
        notes: text('notes'),
        status: mysqlEnum('status', ['pending', 'cleared', 'bounced', 'cancelled']).default('cleared'),
        clearedAt: datetime('cleared_at', { mode: 'date', fsp: 6 }),
        journalEntryId: bigint('journal_entry_id', { mode: 'number' }),
        createdBy: char('created_by', { length: 36 }).notNull(),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
        deletedAt: datetime('deleted_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        uniqueOrgNumber: uniqueIndex('unique_org_number').on(table.orgId, table.paymentNumber),
        orgDateIdx: index('idx_org_date').on(table.orgId, table.paymentDate),
        orgTypeIdx: index('idx_org_type').on(table.orgId, table.paymentType),
        orgPartyIdx: index('idx_org_party').on(table.orgId, table.partyType, table.partyId),
        orgStatusIdx: index('idx_org_status').on(table.orgId, table.status),
        uuidIdx: index('idx_uuid').on(table.uuid),
    })
);

/**
 * Payment Allocations table
 */
export const paymentAllocations = mysqlTable(
    'payment_allocations',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        paymentId: bigint('payment_id', { mode: 'number' }).notNull(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        invoiceId: bigint('invoice_id', { mode: 'number' }).notNull(),
        allocatedAmount: bigint('allocated_amount', { mode: 'number' }).notNull(),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
    },
    (table) => ({
        paymentIdx: index('idx_payment').on(table.paymentId),
        invoiceIdx: index('idx_invoice').on(table.invoiceId),
        orgIdx: index('idx_org').on(table.orgId),
    })
);

/**
 * Purchase Orders table
 */
export const purchaseOrders = mysqlTable(
    'purchase_orders',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        uuid: char('uuid', { length: 36 }).notNull().unique(),
        poNumber: varchar('po_number', { length: 100 }).notNull(),
        supplierId: bigint('supplier_id', { mode: 'number' }).notNull(),
        poDate: date('po_date', { mode: 'date' }).notNull(),
        expectedDeliveryDate: date('expected_delivery_date', { mode: 'date' }),
        currency: char('currency', { length: 3 }).default('INR'),
        subtotal: bigint('subtotal', { mode: 'number' }).notNull().default(0),
        taxAmount: bigint('tax_amount', { mode: 'number' }).notNull().default(0),
        totalAmount: bigint('total_amount', { mode: 'number' }).notNull().default(0),
        status: mysqlEnum('status', ['draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled']).default('draft'),
        notes: text('notes'),
        termsAndConditions: text('terms_and_conditions'),
        createdBy: char('created_by', { length: 36 }).notNull(),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
        deletedAt: datetime('deleted_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        uniqueOrgNumber: uniqueIndex('unique_org_number').on(table.orgId, table.poNumber),
        orgSupplierIdx: index('idx_org_supplier').on(table.orgId, table.supplierId),
        orgDateIdx: index('idx_org_date').on(table.orgId, table.poDate),
        orgStatusIdx: index('idx_org_status').on(table.orgId, table.status),
        uuidIdx: index('idx_uuid').on(table.uuid),
    })
);

/**
 * Purchase Order Items table
 */
export const purchaseOrderItems = mysqlTable(
    'purchase_order_items',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        purchaseOrderId: bigint('purchase_order_id', { mode: 'number' }).notNull(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        lineNumber: smallint('line_number').notNull(),
        productVariantId: bigint('product_variant_id', { mode: 'number' }),
        description: text('description').notNull(),
        quantity: decimal('quantity', { precision: 18, scale: 4 }).notNull(),
        unitId: bigint('unit_id', { mode: 'number' }),
        unitPrice: bigint('unit_price', { mode: 'number' }).notNull(),
        taxRateId: bigint('tax_rate_id', { mode: 'number' }),
        totalAmount: bigint('total_amount', { mode: 'number' }).notNull(),
        receivedQuantity: decimal('received_quantity', { precision: 18, scale: 4 }).default('0'),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
    },
    (table) => ({
        purchaseOrderIdx: index('idx_purchase_order').on(table.purchaseOrderId),
        orgProductIdx: index('idx_org_product').on(table.orgId, table.productVariantId),
    })
);

/**
 * Purchase Bills table
 */
export const purchaseBills = mysqlTable(
    'purchase_bills',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        uuid: char('uuid', { length: 36 }).notNull().unique(),
        billNumber: varchar('bill_number', { length: 100 }).notNull(),
        supplierInvoiceNumber: varchar('supplier_invoice_number', { length: 100 }),
        supplierId: bigint('supplier_id', { mode: 'number' }).notNull(),
        billDate: date('bill_date', { mode: 'date' }).notNull(),
        dueDate: date('due_date', { mode: 'date' }),
        purchaseOrderId: bigint('purchase_order_id', { mode: 'number' }),
        currency: char('currency', { length: 3 }).default('INR'),
        subtotal: bigint('subtotal', { mode: 'number' }).notNull().default(0),
        taxAmount: bigint('tax_amount', { mode: 'number' }).notNull().default(0),
        totalAmount: bigint('total_amount', { mode: 'number' }).notNull().default(0),
        amountPaid: bigint('amount_paid', { mode: 'number' }).default(0),
        balanceDue: bigint('balance_due', { mode: 'number' }).default(0),
        status: mysqlEnum('status', ['draft', 'posted', 'partially_paid', 'paid', 'cancelled']).default('draft'),
        paymentStatus: mysqlEnum('payment_status', ['unpaid', 'partially_paid', 'paid']).default('unpaid'),
        journalEntryId: bigint('journal_entry_id', { mode: 'number' }),
        createdBy: char('created_by', { length: 36 }).notNull(),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
        deletedAt: datetime('deleted_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        uniqueOrgNumber: uniqueIndex('unique_org_number').on(table.orgId, table.billNumber),
        orgSupplierIdx: index('idx_org_supplier').on(table.orgId, table.supplierId),
        orgDateIdx: index('idx_org_date').on(table.orgId, table.billDate),
        orgStatusIdx: index('idx_org_status').on(table.orgId, table.status),
        uuidIdx: index('idx_uuid').on(table.uuid),
    })
);

/**
 * Bank Accounts table
 */
export const bankAccounts = mysqlTable(
    'bank_accounts',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        uuid: char('uuid', { length: 36 }).notNull().unique(),
        accountName: varchar('account_name', { length: 255 }).notNull(),
        bankName: varchar('bank_name', { length: 255 }),
        branchName: varchar('branch_name', { length: 255 }),
        accountNumberEncrypted: varbinary('account_number_encrypted', { length: 512 }).notNull(),
        accountNumberHash: char('account_number_hash', { length: 64 }).notNull(),
        ifscCode: varchar('ifsc_code', { length: 20 }),
        swiftCode: varchar('swift_code', { length: 20 }),
        accountType: mysqlEnum('account_type', ['savings', 'current', 'cc', 'od', 'other']).default('current'),
        currency: char('currency', { length: 3 }).default('INR'),
        openingBalance: bigint('opening_balance', { mode: 'number' }).default(0),
        currentBalance: bigint('current_balance', { mode: 'number' }).default(0),
        ledgerAccountId: bigint('ledger_account_id', { mode: 'number' }),
        isPrimary: boolean('is_primary').default(false),
        isActive: boolean('is_active').default(true),
        provider: varchar('provider', { length: 100 }),
        providerAccountId: varchar('provider_account_id', { length: 255 }),
        providerCredentialsEncrypted: varbinary('provider_credentials_encrypted', { length: 1024 }),
        autoSyncEnabled: boolean('auto_sync_enabled').default(false),
        lastSyncedAt: datetime('last_synced_at', { mode: 'date', fsp: 6 }),
        syncFrequencyHours: int('sync_frequency_hours').default(24),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
        deletedAt: datetime('deleted_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        orgActiveIdx: index('idx_org_active').on(table.orgId, table.isActive),
        accountHashIdx: index('idx_account_hash').on(table.accountNumberHash),
        uuidIdx: index('idx_uuid').on(table.uuid),
    })
);

/**
 * Bank Transactions table
 */
export const bankTransactions = mysqlTable(
    'bank_transactions',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        uuid: char('uuid', { length: 36 }).notNull().unique(),
        bankAccountId: bigint('bank_account_id', { mode: 'number' }).notNull(),
        transactionDate: date('transaction_date', { mode: 'date' }).notNull(),
        valueDate: date('value_date', { mode: 'date' }),
        description: text('description'),
        referenceNumber: varchar('reference_number', { length: 255 }),
        transactionType: mysqlEnum('transaction_type', ['debit', 'credit']).notNull(),
        amount: bigint('amount', { mode: 'number' }).notNull(),
        balance: bigint('balance', { mode: 'number' }),
        category: varchar('category', { length: 100 }),
        isReconciled: boolean('is_reconciled').default(false),
        reconciledWithType: varchar('reconciled_with_type', { length: 50 }),
        reconciledWithId: char('reconciled_with_id', { length: 36 }),
        reconciledAt: datetime('reconciled_at', { mode: 'date', fsp: 6 }),
        reconciledBy: char('reconciled_by', { length: 36 }),
        notes: text('notes'),
        rawDataId: char('raw_data_id', { length: 36 }),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
    },
    (table) => ({
        orgAccountIdx: index('idx_org_account').on(table.orgId, table.bankAccountId),
        orgDateIdx: index('idx_org_date').on(table.orgId, table.transactionDate),
        orgReconciledIdx: index('idx_org_reconciled').on(table.orgId, table.isReconciled),
        uuidIdx: index('idx_uuid').on(table.uuid),
    })
);

/**
 * GST Return Periods table
 */
export const gstReturnPeriods = mysqlTable(
    'gst_return_periods',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        returnType: mysqlEnum('return_type', ['GSTR1', 'GSTR3B', 'GSTR9', 'GSTR9C']).notNull(),
        periodType: mysqlEnum('period_type', ['monthly', 'quarterly', 'annual']).notNull(),
        periodStart: date('period_start', { mode: 'date' }).notNull(),
        periodEnd: date('period_end', { mode: 'date' }).notNull(),
        filingDueDate: date('filing_due_date', { mode: 'date' }).notNull(),
        status: mysqlEnum('status', ['not_started', 'in_progress', 'ready', 'filed', 'late_filed']).default('not_started'),
        filedAt: datetime('filed_at', { mode: 'date', fsp: 6 }),
        filedBy: char('filed_by', { length: 36 }),
        acknowledgementNumber: varchar('acknowledgement_number', { length: 100 }),
        arn: varchar('arn', { length: 100 }),
        returnData: json('return_data'),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
    },
    (table) => ({
        uniqueOrgPeriod: uniqueIndex('unique_org_period').on(table.orgId, table.returnType, table.periodStart),
        orgTypeIdx: index('idx_org_type').on(table.orgId, table.returnType),
        orgStatusIdx: index('idx_org_status').on(table.orgId, table.status),
        dueDateIdx: index('idx_due_date').on(table.filingDueDate),
    })
);

/**
 * GST Summary table
 */
export const gstSummary = mysqlTable(
    'gst_summary',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        periodStart: date('period_start', { mode: 'date' }).notNull(),
        periodEnd: date('period_end', { mode: 'date' }).notNull(),
        taxableSales: bigint('taxable_sales', { mode: 'number' }).default(0),
        cgstOutput: bigint('cgst_output', { mode: 'number' }).default(0),
        sgstOutput: bigint('sgst_output', { mode: 'number' }).default(0),
        igstOutput: bigint('igst_output', { mode: 'number' }).default(0),
        cessOutput: bigint('cess_output', { mode: 'number' }).default(0),
        taxablePurchases: bigint('taxable_purchases', { mode: 'number' }).default(0),
        cgstInput: bigint('cgst_input', { mode: 'number' }).default(0),
        sgstInput: bigint('sgst_input', { mode: 'number' }).default(0),
        igstInput: bigint('igst_input', { mode: 'number' }).default(0),
        cessInput: bigint('cess_input', { mode: 'number' }).default(0),
        itcClaimed: bigint('itc_claimed', { mode: 'number' }).default(0),
        itcReversed: bigint('itc_reversed', { mode: 'number' }).default(0),
        gstPayable: bigint('gst_payable', { mode: 'number' }).default(0),
        interest: bigint('interest', { mode: 'number' }).default(0),
        lateFee: bigint('late_fee', { mode: 'number' }).default(0),
        lastComputedAt: datetime('last_computed_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        uniqueOrgPeriod: uniqueIndex('unique_org_period').on(table.orgId, table.periodStart, table.periodEnd),
        orgPeriodIdx: index('idx_org_period').on(table.orgId, table.periodStart, table.periodEnd),
    })
);

/**
 * Organization Audit Logs table (org-specific events)
 */
export const orgAuditLogs = mysqlTable(
    'org_audit_logs',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        userId: char('user_id', { length: 36 }),
        action: varchar('action', { length: 100 }).notNull(),
        entityType: varchar('entity_type', { length: 100 }).notNull(),
        entityId: char('entity_id', { length: 36 }).notNull(),
        entityNumber: varchar('entity_number', { length: 100 }),
        changes: json('changes'),
        ipAddress: varchar('ip_address', { length: 64 }),
        userAgent: text('user_agent'),
        requestId: char('request_id', { length: 36 }),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
    },
    (table) => ({
        orgEntityIdx: index('idx_org_entity').on(table.orgId, table.entityType, table.entityId),
        orgUserIdx: index('idx_org_user').on(table.orgId, table.userId),
        orgCreatedIdx: index('idx_org_created').on(table.orgId, table.createdAt),
        createdAtIdx: index('idx_created_at').on(table.createdAt),
    })
);

/**
 * Sequences table
 */
export const sequences = mysqlTable(
    'sequences',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        sequenceType: varchar('sequence_type', { length: 50 }).notNull(),
        prefix: varchar('prefix', { length: 20 }),
        currentValue: bigint('current_value', { mode: 'number' }).notNull().default(0),
        fiscalYear: int('fiscal_year'),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
    },
    (table) => ({
        uniqueOrgTypeYear: uniqueIndex('unique_org_type_year').on(table.orgId, table.sequenceType, table.fiscalYear),
        orgTypeIdx: index('idx_org_type').on(table.orgId, table.sequenceType),
    })
);

/**
 * Notifications table
 */
export const notifications = mysqlTable(
    'notifications',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        userId: char('user_id', { length: 36 }).notNull(),
        notificationType: varchar('notification_type', { length: 50 }).notNull(),
        title: varchar('title', { length: 255 }).notNull(),
        message: text('message'),
        link: varchar('link', { length: 500 }),
        isRead: boolean('is_read').default(false),
        readAt: datetime('read_at', { mode: 'date', fsp: 6 }),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
    },
    (table) => ({
        userReadIdx: index('idx_user_read').on(table.userId, table.isRead),
        orgUserIdx: index('idx_org_user').on(table.orgId, table.userId),
        createdAtIdx: index('idx_created_at').on(table.createdAt),
    })
);

/**
 * Organization Settings table
 */
export const organizationSettings = mysqlTable(
    'organization_settings',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull().unique(),
        invoicePrefix: varchar('invoice_prefix', { length: 20 }).default('INV'),
        invoiceStartingNumber: int('invoice_starting_number').default(1),
        invoiceTerms: text('invoice_terms'),
        paymentPrefix: varchar('payment_prefix', { length: 20 }).default('PAY'),
        defaultPaymentTermsDays: int('default_payment_terms_days').default(30),
        enableGst: boolean('enable_gst').default(true),
        gstRegistrationType: mysqlEnum('gst_registration_type', ['regular', 'composition', 'unregistered']).default('regular'),
        enableInventory: boolean('enable_inventory').default(true),
        inventoryMethod: mysqlEnum('inventory_method', ['FIFO', 'LIFO', 'weighted_average']).default('FIFO'),
        lowStockThreshold: int('low_stock_threshold').default(10),
        settings: json('settings'),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
    }
);

// Relations are defined in a separate file to avoid circular dependencies
