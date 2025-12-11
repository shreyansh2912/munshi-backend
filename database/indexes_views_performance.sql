-- ============================================================================
-- MUNSHI - INDEXES, MATERIALIZED VIEWS & PERFORMANCE OPTIMIZATION
-- ============================================================================

-- ============================================================================
-- COMPOSITE INDEXES FOR TENANT ISOLATION & COMMON QUERIES
-- ============================================================================

-- These are in addition to indexes already defined in schema files

-- Journal entries - common query patterns
CREATE INDEX idx_journal_org_account_date ON journal_lines(org_id, account_id, 
    (SELECT entry_date FROM journal_entries WHERE id = journal_entry_id));

-- Invoices - aging reports
CREATE INDEX idx_invoices_aging ON invoices(org_id, payment_status, due_date)
    WHERE deleted_at IS NULL AND status NOT IN ('cancelled', 'void');

-- Payments - cash flow analysis
CREATE INDEX idx_payments_cashflow ON payments(org_id, payment_date, payment_type, amount)
    WHERE deleted_at IS NULL AND status = 'cleared';

-- Stock movements - inventory valuation
CREATE INDEX idx_stock_valuation ON stock_movements(org_id, product_variant_id, movement_date, movement_type);

-- Bank transactions - reconciliation
CREATE INDEX idx_bank_reconciliation ON bank_transactions(org_id, bank_account_id, is_reconciled, transaction_date)
    WHERE is_reconciled = FALSE;

-- ============================================================================
-- MATERIALIZED VIEWS FOR REPORTS
-- ============================================================================

-- Trial Balance View (refresh daily or on-demand)
CREATE TABLE mv_trial_balance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    account_code VARCHAR(50),
    account_name VARCHAR(255),
    account_type ENUM('asset', 'liability', 'equity', 'income', 'expense', 'contra'),
    debit_balance BIGINT DEFAULT 0,
    credit_balance BIGINT DEFAULT 0,
    net_balance BIGINT DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    last_refreshed_at DATETIME(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    UNIQUE KEY unique_org_account_period (org_id, account_id, period_start, period_end),
    INDEX idx_org_period (org_id, period_start, period_end),
    INDEX idx_org_type (org_id, account_type)
) ENGINE=InnoDB;

-- Procedure to refresh trial balance
DELIMITER $$
CREATE PROCEDURE refresh_trial_balance(
    IN p_org_id BIGINT,
    IN p_period_start DATE,
    IN p_period_end DATE
)
BEGIN
    DELETE FROM mv_trial_balance 
    WHERE org_id = p_org_id 
      AND period_start = p_period_start 
      AND period_end = p_period_end;
    
    INSERT INTO mv_trial_balance (
        org_id, account_id, account_code, account_name, account_type,
        debit_balance, credit_balance, net_balance, period_start, period_end, last_refreshed_at
    )
    SELECT 
        a.org_id,
        a.id AS account_id,
        coa.code AS account_code,
        a.name AS account_name,
        coa.account_type,
        COALESCE(SUM(CASE WHEN jl.dc = 'debit' THEN jl.amount ELSE 0 END), 0) AS debit_balance,
        COALESCE(SUM(CASE WHEN jl.dc = 'credit' THEN jl.amount ELSE 0 END), 0) AS credit_balance,
        COALESCE(SUM(CASE WHEN jl.dc = 'debit' THEN jl.amount ELSE -jl.amount END), 0) AS net_balance,
        p_period_start,
        p_period_end,
        NOW(6)
    FROM accounts a
    JOIN chart_of_accounts coa ON a.coa_id = coa.id
    LEFT JOIN journal_lines jl ON a.id = jl.account_id
    LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id
    WHERE a.org_id = p_org_id
      AND a.deleted_at IS NULL
      AND (je.entry_date BETWEEN p_period_start AND p_period_end OR je.entry_date IS NULL)
      AND (je.status = 'posted' OR je.status IS NULL)
    GROUP BY a.id, a.org_id, coa.code, a.name, coa.account_type;
END$$
DELIMITER ;

-- ============================================================================
-- P&L (Profit & Loss) Materialized View
-- ============================================================================

CREATE TABLE mv_profit_loss (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    account_code VARCHAR(50),
    account_name VARCHAR(255),
    account_type ENUM('income', 'expense'),
    amount BIGINT DEFAULT 0, -- Positive for income, negative for expense
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    last_refreshed_at DATETIME(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    UNIQUE KEY unique_org_account_period (org_id, account_id, period_start, period_end),
    INDEX idx_org_period (org_id, period_start, period_end),
    INDEX idx_org_type (org_id, account_type)
) ENGINE=InnoDB;

-- ============================================================================
-- Balance Sheet Materialized View
-- ============================================================================

CREATE TABLE mv_balance_sheet (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    account_code VARCHAR(50),
    account_name VARCHAR(255),
    account_type ENUM('asset', 'liability', 'equity'),
    amount BIGINT DEFAULT 0,
    as_of_date DATE NOT NULL,
    last_refreshed_at DATETIME(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    UNIQUE KEY unique_org_account_date (org_id, account_id, as_of_date),
    INDEX idx_org_date (org_id, as_of_date),
    INDEX idx_org_type (org_id, account_type)
) ENGINE=InnoDB;

-- ============================================================================
-- Accounts Receivable Aging View
-- ============================================================================

CREATE TABLE mv_ar_aging (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    customer_name VARCHAR(255),
    invoice_id BIGINT NOT NULL,
    invoice_number VARCHAR(100),
    invoice_date DATE,
    due_date DATE,
    days_overdue INT,
    aging_bucket ENUM('current', '1-30', '31-60', '61-90', '90+'),
    invoice_amount BIGINT,
    amount_paid BIGINT,
    balance_due BIGINT,
    as_of_date DATE NOT NULL,
    last_refreshed_at DATETIME(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    INDEX idx_org_date (org_id, as_of_date),
    INDEX idx_org_customer (org_id, customer_id),
    INDEX idx_org_bucket (org_id, aging_bucket)
) ENGINE=InnoDB;

-- ============================================================================
-- Stock Valuation View
-- ============================================================================

CREATE TABLE mv_stock_valuation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    product_variant_id BIGINT NOT NULL,
    product_name VARCHAR(255),
    variant_sku VARCHAR(100),
    location_id BIGINT NOT NULL,
    location_name VARCHAR(255),
    quantity BIGINT,
    average_cost BIGINT, -- In paise
    total_value BIGINT, -- quantity * average_cost
    as_of_date DATE NOT NULL,
    last_refreshed_at DATETIME(6),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    FOREIGN KEY (location_id) REFERENCES stock_locations(id),
    UNIQUE KEY unique_org_variant_location_date (org_id, product_variant_id, location_id, as_of_date),
    INDEX idx_org_date (org_id, as_of_date),
    INDEX idx_org_location (org_id, location_id)
) ENGINE=InnoDB;

-- ============================================================================
-- TRIGGERS FOR BALANCE UPDATES
-- ============================================================================

-- Trigger to update account_balances when journal_lines are inserted
DELIMITER $$
CREATE TRIGGER trg_journal_line_insert_update_balance
AFTER INSERT ON journal_lines
FOR EACH ROW
BEGIN
    DECLARE v_entry_status VARCHAR(20);
    
    -- Get journal entry status
    SELECT status INTO v_entry_status 
    FROM journal_entries 
    WHERE id = NEW.journal_entry_id;
    
    -- Only update balances for posted entries
    IF v_entry_status = 'posted' THEN
        INSERT INTO account_balances (org_id, account_id, balance, last_entry_id, last_updated_at)
        VALUES (
            NEW.org_id,
            NEW.account_id,
            CASE WHEN NEW.dc = 'debit' THEN NEW.amount ELSE -NEW.amount END,
            NEW.journal_entry_id,
            NOW(6)
        )
        ON DUPLICATE KEY UPDATE
            balance = balance + CASE WHEN NEW.dc = 'debit' THEN NEW.amount ELSE -NEW.amount END,
            last_entry_id = NEW.journal_entry_id,
            last_updated_at = NOW(6);
            
        -- Also update cached balance in accounts table
        UPDATE accounts
        SET current_balance = current_balance + CASE WHEN NEW.dc = 'debit' THEN NEW.amount ELSE -NEW.amount END,
            updated_at = NOW(6)
        WHERE id = NEW.account_id;
    END IF;
END$$
DELIMITER ;

-- ============================================================================
-- PARTITIONING MAINTENANCE
-- ============================================================================

-- Procedure to add new partitions for next year
DELIMITER $$
CREATE PROCEDURE add_yearly_partitions()
BEGIN
    DECLARE next_year INT;
    SET next_year = YEAR(CURDATE()) + 1;
    
    -- Add partition for journal_entries
    SET @sql = CONCAT('ALTER TABLE journal_entries REORGANIZE PARTITION p_future INTO (
        PARTITION p', next_year, ' VALUES LESS THAN (', next_year + 1, '),
        PARTITION p_future VALUES LESS THAN MAXVALUE
    )');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Add partition for stock_movements
    SET @sql = CONCAT('ALTER TABLE stock_movements REORGANIZE PARTITION p_future INTO (
        PARTITION p', next_year, ' VALUES LESS THAN (', next_year + 1, '),
        PARTITION p_future VALUES LESS THAN MAXVALUE
    )');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Add partition for invoices
    SET @sql = CONCAT('ALTER TABLE invoices REORGANIZE PARTITION p_future INTO (
        PARTITION p', next_year, ' VALUES LESS THAN (', next_year + 1, '),
        PARTITION p_future VALUES LESS THAN MAXVALUE
    )');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Add partition for payments
    SET @sql = CONCAT('ALTER TABLE payments REORGANIZE PARTITION p_future INTO (
        PARTITION p', next_year, ' VALUES LESS THAN (', next_year + 1, '),
        PARTITION p_future VALUES LESS THAN MAXVALUE
    )');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Add partition for bank_transactions
    SET @sql = CONCAT('ALTER TABLE bank_transactions REORGANIZE PARTITION p_future INTO (
        PARTITION p', next_year, ' VALUES LESS THAN (', next_year + 1, '),
        PARTITION p_future VALUES LESS THAN MAXVALUE
    )');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Add partition for audit_logs
    SET @sql = CONCAT('ALTER TABLE audit_logs REORGANIZE PARTITION p_future INTO (
        PARTITION p', next_year, ' VALUES LESS THAN (', next_year + 1, '),
        PARTITION p_future VALUES LESS THAN MAXVALUE
    )');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$
DELIMITER ;

-- Schedule this to run annually (via cron or event scheduler)
-- CREATE EVENT evt_add_yearly_partitions
-- ON SCHEDULE EVERY 1 YEAR STARTS '2025-01-01 00:00:00'
-- DO CALL add_yearly_partitions();

-- ============================================================================
-- ARCHIVAL STRATEGY
-- ============================================================================

-- Procedure to archive old partitions to cold storage
DELIMITER $$
CREATE PROCEDURE archive_old_partitions(IN archive_year INT)
BEGIN
    -- Export partition data to CSV/Parquet
    -- Then drop the partition
    
    SET @sql = CONCAT('ALTER TABLE journal_entries DROP PARTITION p', archive_year);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Repeat for other partitioned tables
    -- Note: Before dropping, export data to S3/GCS using SELECT INTO OUTFILE
    -- or mysqldump with --where clause
END$$
DELIMITER ;

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================

/*
1. All tenant-scoped queries MUST include org_id in WHERE clause
2. Use composite indexes (org_id, other_columns) for tenant isolation
3. Partition large tables (journal_entries, invoices, payments) by year
4. Refresh materialized views:
   - Trial balance: Daily or on-demand
   - P&L: Monthly or on-demand
   - AR aging: Daily
   - Stock valuation: Daily or real-time via triggers
5. Archive old partitions (>3 years) to cold storage (S3 Glacier)
6. Use connection pooling (min 10, max 100 connections)
7. Enable query cache for read-heavy operations
8. Use Redis for caching frequently accessed data (trial balance, P&L)
9. Consider read replicas for reporting queries
10. Monitor slow query log and optimize indexes accordingly
*/
