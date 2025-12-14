/**
 * Files Schema - File Upload and Management
 */

import {
    mysqlTable,
    bigint,
    char,
    varchar,
    datetime,
    mysqlEnum,
    index,
    uniqueIndex,
    text,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { organizations, users } from './core';

/**
 * Files table - Track all uploaded files
 */
export const files = mysqlTable(
    'files',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        uuid: char('uuid', { length: 36 }).notNull().unique(),
        disk: varchar('disk', { length: 50 }).notNull(), // 'local', 's3'
        path: varchar('path', { length: 500 }).notNull(),
        filename: varchar('filename', { length: 255 }).notNull(),
        originalFilename: varchar('original_filename', { length: 255 }).notNull(),
        mimeType: varchar('mime_type', { length: 100 }),
        size: bigint('size', { mode: 'number' }).notNull(), // in bytes
        visibility: mysqlEnum('visibility', ['public', 'private']).default('private'),
        uploadedBy: char('uploaded_by', { length: 36 }).notNull(),
        meta: text('meta'), // JSON metadata
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        deletedAt: datetime('deleted_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        orgIdx: index('idx_org').on(table.orgId),
        uuidIdx: uniqueIndex('idx_uuid').on(table.uuid),
        diskPathIdx: index('idx_disk_path').on(table.disk, table.path),
        uploadedByIdx: index('idx_uploaded_by').on(table.uploadedBy),
    })
);

/**
 * Files relations
 */
export const filesRelations = relations(files, ({ one }) => ({
    organization: one(organizations, {
        fields: [files.orgId],
        references: [organizations.id],
    }),
    uploader: one(users, {
        fields: [files.uploadedBy],
        references: [users.id],
    }),
}));
