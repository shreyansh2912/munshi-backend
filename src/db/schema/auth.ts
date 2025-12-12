/**
 * Authentication Tables Schema
 * Migrated from Prisma - Session management and security
 */

import {
    mysqlTable,
    varchar,
    char,
    datetime,
    text,
    index,
    uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { users } from './core';

/**
 * Refresh Tokens - JWT refresh token storage
 */
export const refreshTokens = mysqlTable(
    'refresh_tokens',
    {
        id: char('id', { length: 36 }).primaryKey(),
        token: varchar('token', { length: 500 }).notNull().unique(),
        userId: char('user_id', { length: 36 }).notNull(),
        deviceFingerprint: varchar('device_fingerprint', { length: 255 }).notNull(),
        expiresAt: datetime('expires_at', { mode: 'date', fsp: 6 }).notNull(),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
    },
    (table) => ({
        userIdIdx: index('idx_user_id').on(table.userId),
        tokenIdx: index('idx_token').on(table.token),
        expiresAtIdx: index('idx_expires_at').on(table.expiresAt),
        uniqueUserDevice: uniqueIndex('unique_user_device').on(table.userId, table.deviceFingerprint),
    })
);

/**
 * Device Fingerprints - Device tracking for security
 */
export const deviceFingerprints = mysqlTable(
    'device_fingerprints',
    {
        userId: char('user_id', { length: 36 }).notNull(),
        fingerprint: varchar('fingerprint', { length: 255 }).notNull(),
        userAgent: text('user_agent').notNull(),
        ipAddress: varchar('ip_address', { length: 45 }),
        lastUsedAt: datetime('last_used_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
    },
    (table) => ({
        // Composite primary key
        pk: uniqueIndex('pk_device_fingerprint').on(table.userId, table.fingerprint),
        userIdIdx: index('idx_user_id').on(table.userId),
        lastUsedAtIdx: index('idx_last_used_at').on(table.lastUsedAt),
    })
);

/**
 * Audit Logs - Security audit trail
 */
export const auditLogs = mysqlTable(
    'audit_logs',
    {
        id: char('id', { length: 36 }).primaryKey(),
        userId: char('user_id', { length: 36 }),
        action: varchar('action', { length: 255 }).notNull(),
        entity: varchar('entity', { length: 100 }).notNull(),
        entityId: char('entity_id', { length: 36 }),
        changes: text('changes'), // JSON string
        ipAddress: varchar('ip_address', { length: 45 }).notNull(),
        userAgent: text('user_agent').notNull(),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
    },
    (table) => ({
        userIdIdx: index('idx_user_id').on(table.userId),
        entityIdx: index('idx_entity').on(table.entity),
        createdAtIdx: index('idx_created_at').on(table.createdAt),
    })
);

/**
 * Relations
 */
export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
    user: one(users, {
        fields: [refreshTokens.userId],
        references: [users.id],
    }),
}));

export const deviceFingerprintsRelations = relations(deviceFingerprints, ({ one }) => ({
    user: one(users, {
        fields: [deviceFingerprints.userId],
        references: [users.id],
    }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, {
        fields: [auditLogs.userId],
        references: [users.id],
    }),
}));
