/**
 * User Module - Routes
 */

import { FastifyInstance } from 'fastify';

import {
    getProfileHandler,
    updateProfileHandler,
    listUsersHandler,
} from './user.controller.js';
import { authenticate } from '@middlewares/auth.js';
import { requireAdmin } from '@middlewares/rbac.js';
import { validate } from '@middlewares/validate.js';
import { updateProfileSchema } from './user.validation.js';

/**
 * Register user routes
 */
export const userRoutes = async (fastify: FastifyInstance): Promise<void> => {
    // Get current user profile
    fastify.get(
        '/me',
        {
            preHandler: [authenticate],
        },
        getProfileHandler
    );

    // Update current user profile
    fastify.patch(
        '/me',
        {
            preHandler: [authenticate, validate({ body: updateProfileSchema })],
        },
        updateProfileHandler
    );

    // List all users (admin only)
    fastify.get(
        '/',
        {
            preHandler: [authenticate, requireAdmin],
        },
        listUsersHandler
    );
};
