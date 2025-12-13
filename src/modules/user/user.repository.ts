/**
 * User Module - Repository
 */

import { db } from '@db/mysql/client.js';
import { users } from '@db/schema/core.js';
import { eq, desc, count } from 'drizzle-orm';
import { InferSelectModel } from 'drizzle-orm';

export type User = InferSelectModel<typeof users>;

/**
 * Find user by ID
 */
export const findById = async (id: string): Promise<User | undefined> => {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
};

/**
 * Update user
 */
export const updateUser = async (
    id: string,
    data: Partial<User>
): Promise<User> => {
    await db.update(users).set(data).where(eq(users.id, id));
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
};

/**
 * List users (admin only)
 */
export const listUsers = async (skip: number, take: number): Promise<User[]> => {
    return db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(take)
        .offset(skip);
};

/**
 * Count users
 */
export const countUsers = async (): Promise<number> => {
    const result = await db.select({ count: count() }).from(users);
    return result[0].count;
};
