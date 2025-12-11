-- ============================================================================
-- MUNSHI MULTI-TENANT SAAS - MYSQL DATABASE SCHEMA (PART 2)
-- Invoicing, GST, Tax, Products & Inventory
-- ============================================================================

-- ============================================================================
-- 5. TAX RATES & GST CONFIGURATION
-- ============================================================================

-- Tax rates master
CREATE TABLE tax_rates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    rate DECIMAL(5,2) NOT NULL, -- e.g., 18.00 for 18%
    tax_type ENUM('CGST', 'SGST', 'IGST', 'CESS', 'TDS', 'TCS', 'OTHER') NOT NULL,
    hsn_code VARCHAR(50),
    sac_code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE,
    effective_to DATE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_org_active (org_id, is_active),
    INDEX idx_org_type (org_id, tax_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. PRODUCTS & INVENTORY
-- ============================================================================

-- Product categories
CREATE TABLE product_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_id BIGINT NULL,
    description TEXT,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES product_categories(id),
    INDEX idx_org_parent (org_id, parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products master
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    uuid CHAR(36) NOT NULL UNIQUE,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id BIGINT,
    hsn_code VARCHAR(50),
    sac_code VARCHAR(50),
    product_type ENUM('goods', 'service') DEFAULT 'goods',
    unit_id BIGINT, -- Base unit
    has_variants BOOLEAN DEFAULT FALSE,
    track_inventory BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    meta JSON,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES product_categories(id),
    UNIQUE KEY unique_org_sku (org_id, sku),
    INDEX idx_org_name (org_id, name),
    INDEX idx_org_category (org_id, category_id),
    INDEX idx_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product variants (for size, color, etc.)
CREATE TABLE product_variants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    org_id BIGINT NOT NULL,
    uuid CHAR(36) NOT NULL UNIQUE,
    variant_sku VARCHAR(100) NOT NULL,
    variant_name VARCHAR(255),
    attributes JSON, -- {color: 'red', size: 'L'}
    cost_price BIGINT DEFAULT 0, -- In paise
    selling_price BIGINT DEFAULT 0, -- In paise
    mrp BIGINT DEFAULT 0, -- In paise
    barcode VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_org_variant_sku (org_id, variant_sku),
    INDEX idx_product (product_id),
    INDEX idx_org_barcode (org_id, barcode),
    INDEX idx_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Units of measurement
CREATE TABLE units (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    short_code VARCHAR(10) NOT NULL,
    unit_type ENUM('quantity', 'weight', 'volume', 'length', 'area', 'time', 'other') DEFAULT 'quantity',
    base_unit_id BIGINT NULL, -- For conversions
    conversion_factor DECIMAL(18,8) DEFAULT 1.00000000, -- To base unit
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (base_unit_id) REFERENCES units(id),
    UNIQUE KEY unique_org_code (org_id, short_code),
    INDEX idx_org_type (org_id, unit_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock locations/warehouses
CREATE TABLE stock_locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    uuid CHAR(36) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    location_type ENUM('warehouse', 'store', 'transit', 'virtual') DEFAULT 'warehouse',
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_org_active (org_id, is_active),
    INDEX idx_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock batches (for batch/lot tracking)
CREATE TABLE stock_batches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    uuid CHAR(36) NOT NULL UNIQUE,
    product_variant_id BIGINT NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE,
    purchase_price BIGINT, -- In paise
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    UNIQUE KEY unique_org_batch (org_id, product_variant_id, batch_number),
    INDEX idx_org_variant (org_id, product_variant_id),
    INDEX idx_expiry (expiry_date),
    INDEX idx_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock movements (all inventory transactions)
CREATE TABLE stock_movements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    uuid CHAR(36) NOT NULL UNIQUE,
    movement_date DATETIME(6) NOT NULL,
    movement_type ENUM('purchase', 'sale', 'adjustment', 'transfer', 'return', 'opening', 'damage', 'production') NOT NULL,
    product_variant_id BIGINT NOT NULL,
    batch_id BIGINT NULL,
    quantity BIGINT NOT NULL, -- In base unit (can be negative for outward)
    from_location_id BIGINT NULL,
    to_location_id BIGINT NULL,
    reference_type VARCHAR(50), -- 'invoice', 'purchase_order', etc.
    reference_id CHAR(36),
    reference_number VARCHAR(100),
    notes TEXT,
    created_by BIGINT NOT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    FOREIGN KEY (batch_id) REFERENCES stock_batches(id),
    FOREIGN KEY (from_location_id) REFERENCES stock_locations(id),
    FOREIGN KEY (to_location_id) REFERENCES stock_locations(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_org_date (org_id, movement_date),
    INDEX idx_org_variant (org_id, product_variant_id),
    INDEX idx_org_type (org_id, movement_type),
    INDEX idx_reference (org_id, reference_type, reference_id),
    INDEX idx_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
PARTITION BY RANGE (YEAR(movement_date)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Stock summary (materialized view for current stock)
CREATE TABLE stock_summary (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    product_variant_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    batch_id BIGINT NULL,
    quantity BIGINT NOT NULL DEFAULT 0, -- Current stock in base unit
    reserved_quantity BIGINT NOT NULL DEFAULT 0, -- Reserved for orders
    available_quantity BIGINT NOT NULL DEFAULT 0, -- quantity - reserved
    last_movement_id BIGINT,
    last_updated_at DATETIME(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    FOREIGN KEY (location_id) REFERENCES stock_locations(id),
    FOREIGN KEY (batch_id) REFERENCES stock_batches(id),
    UNIQUE KEY unique_stock (org_id, product_variant_id, location_id, batch_id),
    INDEX idx_org_variant (org_id, product_variant_id),
    INDEX idx_org_location (org_id, location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. SALES INVOICES
-- ============================================================================

-- Sales invoices
CREATE TABLE invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    uuid CHAR(36) NOT NULL UNIQUE,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_type ENUM('tax_invoice', 'proforma', 'credit_note', 'debit_note', 'export_invoice') DEFAULT 'tax_invoice',
    customer_id BIGINT NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    place_of_supply VARCHAR(100), -- State for GST
    is_reverse_charge BOOLEAN DEFAULT FALSE,
    is_export BOOLEAN DEFAULT FALSE,
    export_type ENUM('with_payment', 'without_payment', 'deemed_export') NULL,
    shipping_bill_number VARCHAR(100),
    shipping_bill_date DATE,
    port_code VARCHAR(50),
    currency CHAR(3) DEFAULT 'INR',
    exchange_rate DECIMAL(18,6) DEFAULT 1.000000,
    subtotal BIGINT NOT NULL DEFAULT 0, -- In paise
    discount_amount BIGINT DEFAULT 0,
    taxable_amount BIGINT NOT NULL DEFAULT 0,
    tax_amount BIGINT NOT NULL DEFAULT 0,
    round_off BIGINT DEFAULT 0,
    total_amount BIGINT NOT NULL DEFAULT 0,
    amount_paid BIGINT DEFAULT 0,
    balance_due BIGINT DEFAULT 0,
    status ENUM('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled', 'void') DEFAULT 'draft',
    payment_status ENUM('unpaid', 'partially_paid', 'paid') DEFAULT 'unpaid',
    notes TEXT,
    terms_and_conditions TEXT,
    journal_entry_id BIGINT NULL, -- Linked journal entry
    version INT DEFAULT 0, -- Optimistic locking
    created_by BIGINT NOT NULL,
    sent_at DATETIME(6),
    paid_at DATETIME(6),
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY unique_org_number (org_id, invoice_number),
    INDEX idx_org_customer (org_id, customer_id),
    INDEX idx_org_date (org_id, invoice_date),
    INDEX idx_org_status (org_id, status),
    INDEX idx_org_payment_status (org_id, payment_status),
    INDEX idx_due_date (org_id, due_date),
    INDEX idx_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
PARTITION BY RANGE (YEAR(invoice_date)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Invoice line items
CREATE TABLE invoice_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    org_id BIGINT NOT NULL,
    line_number SMALLINT NOT NULL,
    product_variant_id BIGINT NULL,
    description TEXT NOT NULL,
    hsn_code VARCHAR(50),
    sac_code VARCHAR(50),
    quantity DECIMAL(18,4) NOT NULL,
    unit_id BIGINT,
    unit_price BIGINT NOT NULL, -- In paise
    discount_percent DECIMAL(5,2) DEFAULT 0.00,
    discount_amount BIGINT DEFAULT 0,
    taxable_amount BIGINT NOT NULL,
    is_tax_inclusive BOOLEAN DEFAULT FALSE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    FOREIGN KEY (unit_id) REFERENCES units(id),
    INDEX idx_invoice (invoice_id),
    INDEX idx_org_product (org_id, product_variant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice tax lines (GST breakdown per item)
CREATE TABLE invoice_tax_lines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_item_id BIGINT NOT NULL,
    org_id BIGINT NOT NULL,
    tax_rate_id BIGINT NOT NULL,
    tax_type ENUM('CGST', 'SGST', 'IGST', 'CESS', 'TDS', 'TCS') NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL,
    taxable_amount BIGINT NOT NULL, -- In paise
    tax_amount BIGINT NOT NULL, -- In paise
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (invoice_item_id) REFERENCES invoice_items(id) ON DELETE CASCADE,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (tax_rate_id) REFERENCES tax_rates(id),
    INDEX idx_invoice_item (invoice_item_id),
    INDEX idx_org_tax_type (org_id, tax_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Continue in next file...
