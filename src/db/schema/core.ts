/**
 * Core Tables Schema - Users, Organizations, Memberships, Roles
 * Multi-tenant foundation for the Munshi accounting system
 */

import {
    mysqlTable,
    bigint,
    char,
    varchar,
    boolean,
    datetime,
    mysqlEnum,
    text,
    json,
    index,
    uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

/**
 * Users table (global, not tenant-scoped)
 */
export const users = mysqlTable(
    'users',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        uuid: char('uuid', { length: 36 }).notNull().unique(),
        email: varchar('email', { length: 255 }).notNull().unique(),
        phone: varchar('phone', { length: 32 }),
        passwordHash: varchar('password_hash', { length: 255 }).notNull(),
        name: varchar('name', { length: 200 }),
        isSuperAdmin: boolean('is_super_admin').default(false),
        emailVerified: boolean('email_verified').default(false),
        phoneVerified: boolean('phone_verified').default(false),
        lastLoginAt: datetime('last_login_at', { mode: 'date', fsp: 6 }),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().defaultNow(),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().defaultNow().$onUpdate(() => new Date()),
        deletedAt: datetime('deleted_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        emailIdx: index('idx_email').on(table.email),
        uuidIdx: index('idx_uuid').on(table.uuid),
        deletedAtIdx: index('idx_deleted_at').on(table.deletedAt),
    })
);

/**
 * Organizations table (tenants)
 */
export const organizations = mysqlTable(
    'organizations',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        uuid: char('uuid', { length: 36 }).notNull().unique(),
        name: varchar('name', { length: 255 }).notNull(),
        legalName: varchar('legal_name', { length: 255 }),
        gstin: varchar('gstin', { length: 15 }),
        pan: varchar('pan', { length: 10 }),
        tan: varchar('tan', { length: 10 }),
        cin: varchar('cin', { length: 21 }),
        businessType: mysqlEnum('business_type', [
            'proprietorship',
            'partnership',
            'llp',
            'private_limited',
            'public_limited',
            'other',
        ]).default('proprietorship'),
        industry: varchar('industry', { length: 100 }),
        currency: char('currency', { length: 3 }).default('INR'),
        timezone: varchar('timezone', { length: 64 }).default('Asia/Kolkata'),
        fiscalYearStartMonth: bigint('fiscal_year_start_month', { mode: 'number' }).default(4),
        addressLine1: varchar('address_line1', { length: 255 }),
        addressLine2: varchar('address_line2', { length: 255 }),
        city: varchar('city', { length: 100 }),
        state: varchar('state', { length: 100 }),
        pincode: varchar('pincode', { length: 10 }),
        country: char('country', { length: 2 }).default('IN'),
        logoUrl: varchar('logo_url', { length: 500 }),
        website: varchar('website', { length: 255 }),
        email: varchar('email', { length: 255 }),
        phone: varchar('phone', { length: 32 }),
        subscriptionPlan: varchar('subscription_plan', { length: 50 }).default('free'),
        subscriptionStatus: mysqlEnum('subscription_status', ['trial', 'active', 'suspended', 'cancelled']).default('trial'),
        trialEndsAt: datetime('trial_ends_at', { mode: 'date', fsp: 6 }),
        createdBy: bigint('created_by', { mode: 'number' }).notNull(),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().defaultNow(),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().defaultNow().$onUpdate(() => new Date()),
        deletedAt: datetime('deleted_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        uuidIdx: index('idx_uuid').on(table.uuid),
        gstinIdx: index('idx_gstin').on(table.gstin),
        createdByIdx: index('idx_created_by').on(table.createdBy),
        subscriptionStatusIdx: index('idx_subscription_status').on(table.subscriptionStatus),
        deletedAtIdx: index('idx_deleted_at').on(table.deletedAt),
    })
);

/**
 * Roles table (RBAC)
 */
export const roles = mysqlTable(
    'roles',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }),
        name: varchar('name', { length: 100 }).notNull(),
        description: text('description'),
        isSystem: boolean('is_system').default(false),
        permissions: json('permissions').$type<string[]>(),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().defaultNow(),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().defaultNow().$onUpdate(() => new Date()),
    },
    (table) => ({
        orgIdIdx: index('idx_org_id').on(table.orgId),
        isSystemIdx: index('idx_is_system').on(table.isSystem),
    })
);

/**
 * Memberships table (user-organization relationship)
 */
export const memberships = mysqlTable(
    'memberships',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        userId: bigint('user_id', { mode: 'number' }).notNull(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        roleId: bigint('role_id', { mode: 'number' }).notNull(),
        status: mysqlEnum('status', ['active', 'invited', 'suspended', 'left']).default('invited'),
        joinedAt: datetime('joined_at', { mode: 'date', fsp: 6 }),
        inviteToken: char('invite_token', { length: 36 }),
        inviteSentAt: datetime('invite_sent_at', { mode: 'date', fsp: 6 }),
        inviteExpiresAt: datetime('invite_expires_at', { mode: 'date', fsp: 6 }),
        lastActiveAt: datetime('last_active_at', { mode: 'date', fsp: 6 }),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().defaultNow(),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().defaultNow().$onUpdate(() => new Date()),
    },
    (table) => ({
        uniqueUserOrg: uniqueIndex('unique_user_org').on(table.userId, table.orgId),
        orgStatusIdx: index('idx_org_status').on(table.orgId, table.status),
        userStatusIdx: index('idx_user_status').on(table.userId, table.status),
        inviteTokenIdx: index('idx_invite_token').on(table.inviteToken),
    })
);

/**
 * Relations
 */
export const usersRelations = relations(users, ({ many }) => ({
    memberships: many(memberships),
    createdOrganizations: many(organizations),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
    creator: one(users, {
        fields: [organizations.createdBy],
        references: [users.id],
    }),
    memberships: many(memberships),
    roles: many(roles),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [roles.orgId],
        references: [organizations.id],
    }),
    memberships: many(memberships),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
    user: one(users, {
        fields: [memberships.userId],
        references: [users.id],
    }),
    organization: one(organizations, {
        fields: [memberships.orgId],
        references: [organizations.id],
    }),
    role: one(roles, {
        fields: [memberships.roleId],
        references: [roles.id],
    }),
}));
