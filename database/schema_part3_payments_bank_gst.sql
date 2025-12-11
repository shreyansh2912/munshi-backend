-- ============================================================================
-- MUNSHI MULTI-TENANT SAAS - MYSQL DATABASE SCHEMA (PART 3)
-- Payments, Purchase Orders, Bank Accounts, GST Returns, Audit
-- ============================================================================

-- ============================================================================
-- 8. PAYMENTS & RECEIPTS
-- ============================================================================

-- Payments (both received and made)
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    uuid CHAR(36) NOT NULL UNIQUE,
    payment_number VARCHAR(100) NOT NULL,
    payment_type ENUM('receipt', 'payment') NOT NULL, -- receipt = money in, payment = money out
    payment_date DATE NOT NULL,
    party_type ENUM('customer', 'supplier', 'other') NOT NULL,
    party_id BIGINT NOT NULL, -- customer_id or supplier_id
    amount BIGINT NOT NULL, -- In paise
    currency CHAR(3) DEFAULT 'INR',
    exchange_rate DECIMAL(18,6) DEFAULT 1.000000,
    payment_method ENUM('cash', 'bank_transfer', 'upi', 'card', 'cheque', 'dd', 'other') NOT NULL,
    bank_account_id BIGINT NULL,
    reference_number VARCHAR(255), -- Cheque number, UTR, etc.
    cheque_number VARCHAR(100),
    cheque_date DATE,
    upi_transaction_id VARCHAR(255),
    notes TEXT,
    status ENUM('pending', 'cleared', 'bounced', 'cancelled') DEFAULT 'cleared',
    cleared_at DATETIME(6),
    journal_entry_id BIGINT NULL,
    created_by BIGINT NOT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY unique_org_number (org_id, payment_number),
    INDEX idx_org_date (org_id, payment_date),
    INDEX idx_org_type (org_id, payment_type),
    INDEX idx_org_party (org_id, party_type, party_id),
    INDEX idx_org_status (org_id, status),
    INDEX idx_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
PARTITION BY RANGE (YEAR(payment_date)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Payment allocations (link payments to invoices)
CREATE TABLE payment_allocations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id BIGINT NOT NULL,
    org_id BIGINT NOT NULL,
    invoice_id BIGINT NOT NULL,
    allocated_amount BIGINT NOT NULL, -- In paise
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    INDEX idx_payment (payment_id),
    INDEX idx_invoice (invoice_id),
    INDEX idx_org (org_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. PURCHASE ORDERS & BILLS
-- ============================================================================

-- Purchase orders
CREATE TABLE purchase_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    uuid CHAR(36) NOT NULL UNIQUE,
    po_number VARCHAR(100) NOT NULL,
    supplier_id BIGINT NOT NULL,
    po_date DATE NOT NULL,
    expected_delivery_date DATE,
    currency CHAR(3) DEFAULT 'INR',
    subtotal BIGINT NOT NULL DEFAULT 0,
    tax_amount BIGINT NOT NULL DEFAULT 0,
    total_amount BIGINT NOT NULL DEFAULT 0,
    status ENUM('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled') DEFAULT 'draft',
    notes TEXT,
    terms_and_conditions TEXT,
    created_by BIGINT NOT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY unique_org_number (org_id, po_number),
    INDEX idx_org_supplier (org_id, supplier_id),
    INDEX idx_org_date (org_id, po_date),
    INDEX idx_org_status (org_id, status),
    INDEX idx_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purchase order items
CREATE TABLE purchase_order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL,
    org_id BIGINT NOT NULL,
    line_number SMALLINT NOT NULL,
    product_variant_id BIGINT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(18,4) NOT NULL,
    unit_id BIGINT,
    unit_price BIGINT NOT NULL,
    tax_rate_id BIGINT,
    total_amount BIGINT NOT NULL,
    received_quantity DECIMAL(18,4) DEFAULT 0,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    FOREIGN KEY (unit_id) REFERENCES units(id),
    FOREIGN KEY (tax_rate_id) REFERENCES tax_rates(id),
    INDEX idx_purchase_order (purchase_order_id),
    INDEX idx_org_product (org_id, product_variant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purchase bills (supplier invoices)
CREATE TABLE purchase_bills (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    uuid CHAR(36) NOT NULL UNIQUE,
    bill_number VARCHAR(100) NOT NULL, -- Our internal number
    supplier_invoice_number VARCHAR(100), -- Supplier's invoice number
    supplier_id BIGINT NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE,
    purchase_order_id BIGINT NULL,
    currency CHAR(3) DEFAULT 'INR',
    subtotal BIGINT NOT NULL DEFAULT 0,
    tax_amount BIGINT NOT NULL DEFAULT 0,
    total_amount BIGINT NOT NULL DEFAULT 0,
    amount_paid BIGINT DEFAULT 0,
    balance_due BIGINT DEFAULT 0,
    status ENUM('draft', 'posted', 'partially_paid', 'paid', 'cancelled') DEFAULT 'draft',
    payment_status ENUM('unpaid', 'partially_paid', 'paid') DEFAULT 'unpaid',
    journal_entry_id BIGINT NULL,
    created_by BIGINT NOT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY unique_org_number (org_id, bill_number),
    INDEX idx_org_supplier (org_id, supplier_id),
    INDEX idx_org_date (org_id, bill_date),
    INDEX idx_org_status (org_id, status),
    INDEX idx_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. BANK ACCOUNTS & RECONCILIATION
-- ============================================================================

-- Bank accounts
CREATE TABLE bank_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    uuid CHAR(36) NOT NULL UNIQUE,
    account_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255),
    branch_name VARCHAR(255),
    account_number_encrypted VARBINARY(512) NOT NULL, -- Encrypted
    account_number_hash CHAR(64) NOT NULL, -- SHA-256 hash for lookups
    ifsc_code VARCHAR(20),
    swift_code VARCHAR(20),
    account_type ENUM('savings', 'current', 'cc', 'od', 'other') DEFAULT 'current',
    currency CHAR(3) DEFAULT 'INR',
    opening_balance BIGINT DEFAULT 0,
    current_balance BIGINT DEFAULT 0, -- Cached from account_balances
    ledger_account_id BIGINT, -- Linked to accounts table
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    -- Bank sync integration
    provider VARCHAR(100), -- 'finvu', 'zerodha', 'manual', etc.
    provider_account_id VARCHAR(255),
    provider_credentials_encrypted VARBINARY(1024), -- Encrypted API keys
    auto_sync_enabled BOOLEAN DEFAULT FALSE,
    last_synced_at DATETIME(6),
    sync_frequency_hours INT DEFAULT 24,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (ledger_account_id) REFERENCES accounts(id),
    INDEX idx_org_active (org_id, is_active),
    INDEX idx_account_hash (account_number_hash),
    INDEX idx_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bank transactions (parsed from bank statements)
CREATE TABLE bank_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    uuid CHAR(36) NOT NULL UNIQUE,
    bank_account_id BIGINT NOT NULL,
    transaction_date DATE NOT NULL,
    value_date DATE,
    description TEXT,
    reference_number VARCHAR(255),
    transaction_type ENUM('debit', 'credit') NOT NULL,
    amount BIGINT NOT NULL, -- In paise
    balance BIGINT, -- Balance after transaction
    category VARCHAR(100), -- Auto-categorized
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_with_type VARCHAR(50), -- 'invoice', 'payment', 'journal_entry'
    reconciled_with_id CHAR(36),
    reconciled_at DATETIME(6),
    reconciled_by BIGINT,
    notes TEXT,
    raw_data_id CHAR(36), -- Reference to MongoDB raw data
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    FOREIGN KEY (reconciled_by) REFERENCES users(id),
    INDEX idx_org_account (org_id, bank_account_id),
    INDEX idx_org_date (org_id, transaction_date),
    INDEX idx_org_reconciled (org_id, is_reconciled),
    INDEX idx_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
PARTITION BY RANGE (YEAR(transaction_date)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- ============================================================================
-- 11. GST RETURNS & COMPLIANCE
-- ============================================================================

-- GST return periods
CREATE TABLE gst_return_periods (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    return_type ENUM('GSTR1', 'GSTR3B', 'GSTR9', 'GSTR9C') NOT NULL,
    period_type ENUM('monthly', 'quarterly', 'annual') NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    filing_due_date DATE NOT NULL,
    status ENUM('not_started', 'in_progress', 'ready', 'filed', 'late_filed') DEFAULT 'not_started',
    filed_at DATETIME(6),
    filed_by BIGINT,
    acknowledgement_number VARCHAR(100),
    arn VARCHAR(100), -- Application Reference Number
    return_data JSON, -- Complete return JSON
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (filed_by) REFERENCES users(id),
    UNIQUE KEY unique_org_period (org_id, return_type, period_start),
    INDEX idx_org_type (org_id, return_type),
    INDEX idx_org_status (org_id, status),
    INDEX idx_due_date (filing_due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GST summary (pre-computed for returns)
CREATE TABLE gst_summary (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    -- Output GST (Sales)
    taxable_sales BIGINT DEFAULT 0,
    cgst_output BIGINT DEFAULT 0,
    sgst_output BIGINT DEFAULT 0,
    igst_output BIGINT DEFAULT 0,
    cess_output BIGINT DEFAULT 0,
    -- Input GST (Purchases)
    taxable_purchases BIGINT DEFAULT 0,
    cgst_input BIGINT DEFAULT 0,
    sgst_input BIGINT DEFAULT 0,
    igst_input BIGINT DEFAULT 0,
    cess_input BIGINT DEFAULT 0,
    -- ITC (Input Tax Credit)
    itc_claimed BIGINT DEFAULT 0,
    itc_reversed BIGINT DEFAULT 0,
    -- Payable
    gst_payable BIGINT DEFAULT 0,
    interest BIGINT DEFAULT 0,
    late_fee BIGINT DEFAULT 0,
    last_computed_at DATETIME(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_org_period (org_id, period_start, period_end),
    INDEX idx_org_period (org_id, period_start, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 12. AUDIT LOGS & COMPLIANCE
-- ============================================================================

-- Audit logs (immutable append-only)
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    user_id BIGINT NULL,
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'post', 'void'
    entity_type VARCHAR(100) NOT NULL, -- 'invoice', 'payment', 'journal_entry'
    entity_id CHAR(36) NOT NULL,
    entity_number VARCHAR(100), -- Human-readable reference
    changes JSON, -- Before/after diff
    ip_address VARCHAR(64),
    user_agent TEXT,
    request_id CHAR(36), -- For tracing
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_org_entity (org_id, entity_type, entity_id),
    INDEX idx_org_user (org_id, user_id),
    INDEX idx_org_created (org_id, created_at),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- ============================================================================
-- 13. SEQUENCES (for auto-numbering)
-- ============================================================================

-- Sequence generator for invoice numbers, etc.
CREATE TABLE sequences (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    sequence_type VARCHAR(50) NOT NULL, -- 'invoice', 'payment', 'journal_entry'
    prefix VARCHAR(20),
    current_value BIGINT NOT NULL DEFAULT 0,
    fiscal_year INT, -- For yearly reset
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_org_type_year (org_id, sequence_type, fiscal_year),
    INDEX idx_org_type (org_id, sequence_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 14. NOTIFICATIONS & SETTINGS
-- ============================================================================

-- User notifications
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME(6),
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_org_user (org_id, user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Organization settings
CREATE TABLE organization_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL UNIQUE,
    -- Invoice settings
    invoice_prefix VARCHAR(20) DEFAULT 'INV',
    invoice_starting_number INT DEFAULT 1,
    invoice_terms TEXT,
    -- Payment settings
    payment_prefix VARCHAR(20) DEFAULT 'PAY',
    default_payment_terms_days INT DEFAULT 30,
    -- Tax settings
    enable_gst BOOLEAN DEFAULT TRUE,
    gst_registration_type ENUM('regular', 'composition', 'unregistered') DEFAULT 'regular',
    -- Inventory settings
    enable_inventory BOOLEAN DEFAULT TRUE,
    inventory_method ENUM('FIFO', 'LIFO', 'weighted_average') DEFAULT 'FIFO',
    low_stock_threshold INT DEFAULT 10,
    -- Other settings
    settings JSON, -- Additional flexible settings
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
