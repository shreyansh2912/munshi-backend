/**
 * Prisma Enum Types
 * Temporary type definitions until Prisma Client is properly generated
 * These should match the enums defined in prisma/schema.prisma
 */

export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
    ENTERPRISE_MEMBER = 'ENTERPRISE_MEMBER',
}

export enum TransactionType {
    DEBIT = 'DEBIT',
    CREDIT = 'CREDIT',
}

export enum AccountType {
    ASSET = 'ASSET',
    LIABILITY = 'LIABILITY',
    EQUITY = 'EQUITY',
    REVENUE = 'REVENUE',
    EXPENSE = 'EXPENSE',
}

export enum InvoiceStatus {
    DRAFT = 'DRAFT',
    SENT = 'SENT',
    PAID = 'PAID',
    OVERDUE = 'OVERDUE',
    CANCELLED = 'CANCELLED',
}
