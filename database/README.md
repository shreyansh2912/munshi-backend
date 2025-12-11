# Munshi Database Schema

Production-ready database architecture for multi-tenant accounting SaaS.

## 📁 Files

### MySQL Schema (DDL)
1. **schema_part1_core.sql** - Tenancy, authentication, chart of accounts, double-entry bookkeeping, parties
2. **schema_part2_invoicing_inventory.sql** - Tax rates, products, inventory, stock management, sales invoices
3. **schema_part3_payments_bank_gst.sql** - Payments, purchase orders, bank accounts, GST returns, audit logs
4. **indexes_views_performance.sql** - Indexes, materialized views, triggers, partitioning, archival procedures

### MongoDB Schema
5. **mongodb_schema.js** - Collections for bank sync, AI tasks, OCR, event logs, webhooks, file uploads

## 🚀 Quick Start

### 1. Create Database
```bash
mysql -u root -p
CREATE DATABASE munshi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'munshi_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON munshi_db.* TO 'munshi_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Run Schema Scripts
```bash
# Execute in order
mysql -u munshi_user -p munshi_db < schema_part1_core.sql
mysql -u munshi_user -p munshi_db < schema_part2_invoicing_inventory.sql
mysql -u munshi_user -p munshi_db < schema_part3_payments_bank_gst.sql
mysql -u munshi_user -p munshi_db < indexes_views_performance.sql
```

### 3. Initialize MongoDB Collections
```bash
mongosh munshi
load('mongodb_schema.js')
```

### 4. Update Prisma Schema
Update `prisma/schema.prisma` to match the new MySQL schema, then:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

## 📊 Database Overview

### MySQL Tables: 40+
- **Tenancy**: users, organizations, memberships, roles
- **Accounting**: chart_of_accounts, accounts, journal_entries, journal_lines, account_balances
- **Sales**: customers, invoices, invoice_items, invoice_tax_lines
- **Purchases**: suppliers, purchase_orders, purchase_bills
- **Payments**: payments, payment_allocations
- **Inventory**: products, product_variants, stock_locations, stock_batches, stock_movements, stock_summary
- **Banking**: bank_accounts, bank_transactions
- **GST/Tax**: tax_rates, gst_return_periods, gst_summary
- **Materialized Views**: mv_trial_balance, mv_profit_loss, mv_balance_sheet, mv_ar_aging, mv_stock_valuation
- **System**: sequences, notifications, organization_settings, audit_logs

### MongoDB Collections: 9
- bank_sync_raw, broker_holdings_raw
- ai_tasks, ocr_results
- event_logs, webhook_deliveries
- uploaded_files, email_queue, import_jobs

## 🔑 Key Features

### Multi-Tenancy
- Row-level isolation with `org_id`
- Composite indexes for performance
- Application-level enforcement

### Double-Entry Accounting
- Immutable journal entries
- Automatic balance updates via triggers
- Reversal entries for corrections

### GST Compliance
- CGST, SGST, IGST support
- HSN/SAC codes
- GSTR1, GSTR3B return preparation

### Inventory Management
- Batch/lot tracking
- FIFO/LIFO support
- Multi-location stock
- Real-time valuation

### Bank Integration
- Raw data storage in MongoDB
- Automatic reconciliation
- Account Aggregator support

### Security
- Encrypted PII (PAN, account numbers)
- Audit trail for all transactions
- 7-year retention for compliance

## 📈 Performance

### Partitioning
- journal_entries, invoices, payments, bank_transactions: Yearly partitions
- audit_logs: Yearly partitions
- Automatic partition management

### Materialized Views
- Trial balance (refresh daily)
- P&L statement (refresh monthly)
- Balance sheet (refresh on-demand)
- AR aging (refresh daily)
- Stock valuation (refresh daily)

### Indexes
- Composite indexes on (org_id, ...)
- Covering indexes for common queries
- Full-text search on OCR results

## 🔒 Security

### Encryption
- Application-level AES-256-GCM
- KMS for key management
- Hash-based lookups for encrypted fields

### Access Control
- Role-based permissions
- Field-level masking
- Audit logging

## 📝 Documentation

See `implementation_plan.md` for:
- Complete ER diagram
- Tenancy strategy analysis
- Sample transactional flows
- Migration guide (Tally, Excel)
- Backup & archival strategy
- Performance optimization

## 🔄 Migration

### From Tally
1. Export Tally data as XML
2. Parse and validate
3. Map to Munshi schema
4. Import with dry-run mode
5. Review and commit

### From Excel/CSV
1. Upload CSV file
2. Validate data
3. Create entities (customers, products)
4. Generate invoices and journal entries
5. Review validation report

## 📞 Support

For questions or issues:
- Review `implementation_plan.md`
- Check sample queries in `indexes_views_performance.sql`
- Refer to MongoDB schema comments in `mongodb_schema.js`
