/**
 * Auth Module - Repository
 * Database operations for authentication
 */

import { Prisma, User, RefreshToken, DeviceFingerprint } from '@prisma/client';

import { prisma } from '@db/mysql/client.js';

/**
 * Create a new user
 */
export const createUser = async (data: Prisma.UserCreateInput): Promise<User> => {
    return prisma.user.create({ data });
};

/**
 * Find user by email
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
    return prisma.user.findUnique({ where: { email } });
};

/**
 * Find user by ID
 */
export const findUserById = async (id: string): Promise<User | null> => {
    return prisma.user.findUnique({ where: { id } });
};

/**
 * Create refresh token
 */
export const createRefreshToken = async (
    data: Prisma.RefreshTokenCreateInput
): Promise<RefreshToken> => {
    return prisma.refreshToken.create({ data });
};

/**
 * Find refresh token
 */
export const findRefreshToken = async (token: string): Promise<RefreshToken | null> => {
    return prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true },
    });
};

/**
 * Delete refresh token
 */
export const deleteRefreshToken = async (token: string): Promise<void> => {
    await prisma.refreshToken.delete({ where: { token } });
};

/**
 * Delete all refresh tokens for a user
 */
export const deleteUserRefreshTokens = async (userId: string): Promise<void> => {
    await prisma.refreshToken.deleteMany({ where: { userId } });
};

/**
 * Create or update device fingerprint
 */
export const upsertDeviceFingerprint = async (
    userId: string,
    fingerprint: string,
    userAgent: string,
    ipAddress: string
): Promise<DeviceFingerprint> => {
    return prisma.deviceFingerprint.upsert({
        where: {
            userId_fingerprint: {
                userId,
                fingerprint,
            },
        },
        create: {
            userId,
            fingerprint,
            userAgent,
            ipAddress,
            lastUsedAt: new Date(),
        },
        update: {
            userAgent,
            ipAddress,
            lastUsedAt: new Date(),
        },
    });
};

/**
 * Get user's device fingerprints
 */
export const getUserDeviceFingerprints = async (
    userId: string
): Promise<DeviceFingerprint[]> => {
    return prisma.deviceFingerprint.findMany({
        where: { userId },
        orderBy: { lastUsedAt: 'desc' },
    });
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
        const toDelete = devices.slice(keepCount).map((d) => d.id);
        await prisma.deviceFingerprint.deleteMany({
            where: { id: { in: toDelete } },
        });
    }
};
