/**
 * Auth Module - Repository
 * Database operations for authentication using Drizzle ORM
 */

import { db } from '@db/mysql/client.js';
import { users, refreshTokens, deviceFingerprints } from '@db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Type definitions
 */
export interface UserCreateInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'USER' | 'ADMIN' | 'ENTERPRISE_MEMBER';
}

export interface RefreshTokenCreateInput {
    token: string;
    userId: string;
    deviceFingerprint: string;
    expiresAt: Date;
}

/**
 * Create a new user
 */
export const createUser = async (data: UserCreateInput) => {
    const userId = uuidv4();
    await db.insert(users).values({
        id: userId,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || 'USER',
        isActive: true,
        isMfaEnabled: false,
        emailVerified: false,
    });

    // Return the created user
    return db.select().from(users).where(eq(users.id, userId)).then(rows => rows[0]);
};

/**
 * Find user by email
 */
export const findUserByEmail = async (email: string) => {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0] || null;
};

/**
 * Find user by ID
 */
export const findUserById = async (id: string) => {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
};

/**
 * Create refresh token
 */
export const createRefreshToken = async (data: RefreshTokenCreateInput) => {
    const tokenId = uuidv4();
    await db.insert(refreshTokens).values({
        id: tokenId,
        token: data.token,
        userId: data.userId,
        deviceFingerprint: data.deviceFingerprint,
        expiresAt: data.expiresAt,
    });

    return db.select().from(refreshTokens).where(eq(refreshTokens.id, tokenId)).then(rows => rows[0]);
};

/**
 * Find refresh token
 */
export const findRefreshToken = async (token: string) => {
    const result = await db
        .select()
        .from(refreshTokens)
        .leftJoin(users, eq(refreshTokens.userId, users.id))
        .where(eq(refreshTokens.token, token));

    if (!result[0]) return null;

    return {
        ...result[0].refresh_tokens,
        user: result[0].users,
    };
};

/**
 * Delete refresh token
 */
export const deleteRefreshToken = async (token: string): Promise<void> => {
    await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
};

/**
 * Delete all refresh tokens for a user
 */
export const deleteUserRefreshTokens = async (userId: string): Promise<void> => {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
};

/**
 * Create or update device fingerprint
 */
export const upsertDeviceFingerprint = async (
    userId: string,
    fingerprint: string,
    userAgent: string,
    ipAddress: string
) => {
    // Check if exists
    const existing = await db
        .select()
        .from(deviceFingerprints)
        .where(and(
            eq(deviceFingerprints.userId, userId),
            eq(deviceFingerprints.fingerprint, fingerprint)
        ));

    if (existing[0]) {
        // Update
        await db
            .update(deviceFingerprints)
            .set({
                userAgent,
                ipAddress,
                lastUsedAt: new Date(),
            })
            .where(and(
                eq(deviceFingerprints.userId, userId),
                eq(deviceFingerprints.fingerprint, fingerprint)
            ));

        return db
            .select()
            .from(deviceFingerprints)
            .where(and(
                eq(deviceFingerprints.userId, userId),
                eq(deviceFingerprints.fingerprint, fingerprint)
            ))
            .then(rows => rows[0]);
    } else {
        // Insert
        await db.insert(deviceFingerprints).values({
            userId,
            fingerprint,
            userAgent,
            ipAddress,
            lastUsedAt: new Date(),
        });

        return db
            .select()
            .from(deviceFingerprints)
            .where(and(
                eq(deviceFingerprints.userId, userId),
                eq(deviceFingerprints.fingerprint, fingerprint)
            ))
            .then(rows => rows[0]);
    }
};

/**
 * Get user's device fingerprints
 */
export const getUserDeviceFingerprints = async (userId: string) => {
    return db
        .select()
        .from(deviceFingerprints)
        .where(eq(deviceFingerprints.userId, userId))
        .orderBy(desc(deviceFingerprints.lastUsedAt));
};

/**
 * Delete old device fingerprints (keep only latest N)
 */
export const cleanupOldDeviceFingerprints = async (
    userId: string,
    keepCount: number
): Promise<void> => {
    const devices = await getUserDeviceFingerprints(userId);

    if (devices.length > keepCount) {
        const toDelete = devices.slice(keepCount);

        for (const device of toDelete) {
            await db
                .delete(deviceFingerprints)
                .where(and(
                    eq(deviceFingerprints.userId, device.userId),
                    eq(deviceFingerprints.fingerprint, device.fingerprint)
                ));
        }
    }
};
