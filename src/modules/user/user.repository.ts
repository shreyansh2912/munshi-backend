/**
 * User Module - Repository
 */

import { User, Prisma } from '@prisma/client';

import { prisma } from '@db/mysql/client.js';

/**
 * Find user by ID
 */
export const findById = async (id: string): Promise<User | null> => {
    return prisma.user.findUnique({ where: { id } });
};

/**
 * Update user
 */
export const updateUser = async (
    id: string,
    data: Prisma.UserUpdateInput
): Promise<User> => {
    return prisma.user.update({ where: { id }, data });
};

/**
 * List users (admin only)
 */
export const listUsers = async (skip: number, take: number): Promise<User[]> => {
    return prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
    });
};

/**
 * Count users
 */
export const countUsers = async (): Promise<number> => {
    return prisma.user.count();
};
