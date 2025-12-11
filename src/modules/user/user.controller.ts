/**
 * User Module - Controller
 */

import { FastifyRequest, FastifyReply } from 'fastify';

import * as userService from './user.service.js';
import { successJson } from '@helpers/response.js';
import type { UpdateProfileInput } from './user.validation.js';

/**
 * Get current user profile
 * GET /users/me
 */
export const getProfileHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const user = await userService.getProfile(request.user.id);

    return successJson(reply, {
        statusCode: 200,
        message: 'Profile retrieved successfully',
        data: user,
    });
};

/**
 * Update current user profile
 * PATCH /users/me
 */
export const updateProfileHandler = async (
    request: FastifyRequest<{ Body: UpdateProfileInput }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const user = await userService.updateProfile(request.user.id, request.body);

    return successJson(reply, {
        statusCode: 200,
        message: 'Profile updated successfully',
        data: user,
    });
};

/**
 * List all users (admin only)
 * GET /users
 */
export const listUsersHandler = async (
    request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    const page = parseInt(request.query.page ?? '1', 10);
    const limit = parseInt(request.query.limit ?? '10', 10);

    const result = await userService.listUsers(page, limit);

    return successJson(reply, {
        statusCode: 200,
        message: 'Users retrieved successfully',
        data: result,
    });
};
