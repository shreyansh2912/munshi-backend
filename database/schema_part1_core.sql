-- ============================================================================
-- MUNSHI MULTI-TENANT SAAS - MYSQL DATABASE SCHEMA
-- Production-ready schema for Indian accounting SaaS
-- ============================================================================

-- ============================================================================
-- 1. TENANCY & AUTHENTICATION
-- ============================================================================

-- Users table (global, not tenant-scoped)
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(32),
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(200),
    is_super_admin BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_login_at DATETIME(6),
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    INDEX idx_email (email),
    INDEX idx_uuid (uuid),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Organizations (tenants)
CREATE TABLE organizations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    gstin VARCHAR(15),
    pan VARCHAR(10), -- Encrypted at application level
    tan VARCHAR(10),
    cin VARCHAR(21),
    business_type ENUM('proprietorship', 'partnership', 'llp', 'private_limited', 'public_limited', 'other') DEFAULT 'proprietorship',
    industry VARCHAR(100),
    currency CHAR(3) DEFAULT 'INR',
    timezone VARCHAR(64) DEFAULT 'Asia/Kolkata',
    fiscal_year_start_month TINYINT DEFAULT 4, -- April
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country CHAR(2) DEFAULT 'IN',
    logo_url VARCHAR(500),
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(32),
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_status ENUM('trial', 'active', 'suspended', 'cancelled') DEFAULT 'trial',
    trial_ends_at DATETIME(6),
    created_by BIGINT NOT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_uuid (uuid),
    INDEX idx_gstin (gstin),
    INDEX idx_created_by (created_by),
    INDEX idx_subscription_status (subscription_status),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Organization memberships (user-org relationship)
CREATE TABLE memberships (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    org_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    status ENUM('active', 'invited', 'suspended', 'left') DEFAULT 'invited',
    joined_at DATETIME(6),
    invite_token CHAR(36),
    invite_sent_at DATETIME(6),
    invite_expires_at DATETIME(6),
    last_active_at DATETIME(6),
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_org (user_id, org_id),
    INDEX idx_org_status (org_id, status),
    INDEX idx_user_status (user_id, status),
    INDEX idx_invite_token (invite_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Roles (can be org-specific or global)
CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NULL, -- NULL for system/global roles
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- System roles cannot be deleted
    permissions JSON, -- Array of permission strings
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_org_id (org_id),
    INDEX idx_is_system (is_system)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. CHART OF ACCOUNTS (COA) - DOUBLE ENTRY FOUNDATION
-- ============================================================================

-- Chart of Accounts template/master
CREATE TABLE chart_of_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL, -- e.g., "1000", "2001-001"
    name VARCHAR(255) NOT NULL,
    account_type ENUM('asset', 'liability', 'equity', 'income', 'expense', 'contra') NOT NULL,
    account_subtype VARCHAR(100), -- e.g., 'current_asset', 'fixed_asset', 'operating_expense'
    parent_id BIGINT NULL,
    level TINYINT DEFAULT 0, -- Hierarchy depth
    normal_balance ENUM('debit', 'credit') NOT NULL,
    is_system BOOLEAN DEFAULT FALSE, -- System accounts cannot be deleted
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    meta JSON, -- Additional metadata
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES chart_of_accounts(id),
    UNIQUE KEY unique_org_code (org_id, code),
    INDEX idx_org_type (org_id, account_type),
    INDEX idx_org_parent (org_id, parent_id),
    INDEX idx_org_active (org_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ledger Accounts (instances of COA with balances)
CREATE TABLE accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    uuid CHAR(36) NOT NULL UNIQUE,
    coa_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50), -- Can override COA code
    opening_balance BIGINT DEFAULT 0, -- In paise (smallest currency unit)
    opening_balance_date DATE,
    current_balance BIGINT DEFAULT 0, -- Cached balance in paise
    currency CHAR(3) DEFAULT 'INR',
    is_reconcilable BOOLEAN DEFAULT FALSE, -- For bank accounts
    is_active BOOLEAN DEFAULT TRUE,
    version INT DEFAULT 0, -- For optimistic locking
    meta JSON,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (coa_id) REFERENCES chart_of_accounts(id),
    INDEX idx_org_coa (org_id, coa_id),
    INDEX idx_org_active (org_id, is_active),
    INDEX idx_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. JOURNAL ENTRIES - DOUBLE ENTRY BOOKKEEPING
-- ============================================================================

-- Journal Entry header
CREATE TABLE journal_entries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    uuid CHAR(36) NOT NULL UNIQUE,
    entry_number VARCHAR(100), -- Sequential per org
    entry_date DATE NOT NULL,
    entry_type ENUM('manual', 'invoice', 'payment', 'bank_sync', 'adjustment', 'opening', 'closing') DEFAULT 'manual',
    narration TEXT,
    reference_type VARCHAR(50), -- 'invoice', 'payment', 'purchase_order', etc.
    reference_id CHAR(36), -- UUID of referenced entity
    reference_number VARCHAR(100), -- Human-readable reference
    status ENUM('draft', 'posted', 'reversed', 'void') DEFAULT 'draft',
    posted_at DATETIME(6),
    posted_by BIGINT,
    reversed_at DATETIME(6),
    reversed_by BIGINT,
    reversal_of_id BIGINT NULL, -- Points to original entry if this is a reversal
    created_by BIGINT NOT NULL,
    version INT DEFAULT 0, -- Optimistic locking
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (posted_by) REFERENCES users(id),
    FOREIGN KEY (reversed_by) REFERENCES users(id),
    FOREIGN KEY (reversal_of_id) REFERENCES journal_entries(id),
    INDEX idx_org_date (org_id, entry_date),
    INDEX idx_org_status (org_id, status),
    INDEX idx_org_type (org_id, entry_type),
    INDEX idx_reference (org_id, reference_type, reference_id),
    INDEX idx_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
PARTITION BY RANGE (YEAR(entry_date)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Journal Entry lines (debits and credits)
CREATE TABLE journal_lines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    journal_entry_id BIGINT NOT NULL,
    org_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    line_number SMALLINT NOT NULL, -- Order within entry
    amount BIGINT NOT NULL, -- Always positive, in paise
    dc ENUM('debit', 'credit') NOT NULL,
    description TEXT,
    tax_components JSON, -- GST breakdown: {cgst: 900, sgst: 900, igst: 0}
    cost_center_id BIGINT NULL,
    project_id BIGINT NULL,
    meta JSON,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    INDEX idx_journal_entry (journal_entry_id),
    INDEX idx_org_account (org_id, account_id),
    INDEX idx_org_account_date (org_id, account_id, (SELECT entry_date FROM journal_entries WHERE id = journal_entry_id))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Account balances cache (for performance)
CREATE TABLE account_balances (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    balance BIGINT NOT NULL DEFAULT 0, -- In paise
    last_entry_id BIGINT, -- Last journal entry that updated this
    last_updated_at DATETIME(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_org_account (org_id, account_id),
    INDEX idx_org_id (org_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. CUSTOMERS & SUPPLIERS (PARTIES)
-- ============================================================================

-- Customers
CREATE TABLE customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    uuid CHAR(36) NOT NULL UNIQUE,
    customer_code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    gstin VARCHAR(15),
    pan VARCHAR(10), -- Encrypted
    contact_person VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(32),
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_pincode VARCHAR(10),
    billing_country CHAR(2) DEFAULT 'IN',
    shipping_address_line1 VARCHAR(255),
    shipping_address_line2 VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_pincode VARCHAR(10),
    shipping_country CHAR(2) DEFAULT 'IN',
    credit_limit BIGINT DEFAULT 0,
    payment_terms_days INT DEFAULT 30,
    account_id BIGINT, -- Linked ledger account
    is_active BOOLEAN DEFAULT TRUE,
    meta JSON,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    UNIQUE KEY unique_org_code (org_id, customer_code),
    INDEX idx_org_name (org_id, name),
    INDEX idx_org_gstin (org_id, gstin),
    INDEX idx_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Suppliers
CREATE TABLE suppliers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    uuid CHAR(36) NOT NULL UNIQUE,
    supplier_code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    gstin VARCHAR(15),
    pan VARCHAR(10), -- Encrypted
    contact_person VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(32),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country CHAR(2) DEFAULT 'IN',
    payment_terms_days INT DEFAULT 30,
    account_id BIGINT, -- Linked ledger account
    is_active BOOLEAN DEFAULT TRUE,
    meta JSON,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    UNIQUE KEY unique_org_code (org_id, supplier_code),
    INDEX idx_org_name (org_id, name),
    INDEX idx_org_gstin (org_id, gstin),
    INDEX idx_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Continue in next file...
