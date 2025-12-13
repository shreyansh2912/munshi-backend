/**
 * User Module - Service
 */

import type { User } from './user.repository.js';

import * as userRepo from './user.repository.js';
import { NotFoundError } from '@helpers/errors.js';
import type { UpdateProfileInput } from './user.validation.js';

/**
 * Get user profile
 */
export const getProfile = async (userId: string): Promise<Omit<User, 'password'>> => {
    const user = await userRepo.findById(userId);
    if (!user) {
        throw new NotFoundError('User not found');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

/**
 * Update user profile
 */
export const updateProfile = async (
    userId: string,
    data: UpdateProfileInput
): Promise<Omit<User, 'password'>> => {
    const user = await userRepo.updateUser(userId, data);
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

/**
 * List all users (admin only)
 */
export const listUsers = async (
    page: number,
    limit: number
): Promise<{ users: Omit<User, 'password'>[]; total: number }> => {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
        userRepo.listUsers(skip, limit),
        userRepo.countUsers(),
    ]);

    const usersWithoutPassword = users.map(({ password: _, ...user }) => user);

    return { users: usersWithoutPassword, total };
};
