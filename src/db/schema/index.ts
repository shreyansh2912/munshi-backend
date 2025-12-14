/**
 * Main schema export file
 * Aggregates all schema tables for Drizzle ORM
 */

// Core tables (4 tables)
export * from './core';

// Auth tables (3 tables)
export * from './auth';

// Accounting tables (5 tables)
export * from './accounting';

// Party tables (2 tables)
export * from './parties';

// Invoice tables (3 tables)
export * from './invoicing';

// Inventory tables (9 tables)
export * from './inventory';

// Operations tables (14 tables)
export * from './operations';

// Materialized views (5 tables)
export * from './reports';

// Files (1 table)
export * from './files';
