/**
 * Auth Module - Routes
 * Route definitions for authentication endpoints
 */

import { FastifyInstance } from 'fastify';

import {
    registerHandler,
    loginHandler,
    refreshHandler,
    logoutHandler,
    logoutAllHandler,
} from './auth.controller.js';
import { validate } from '@middlewares/validate.js';
import { authenticate } from '@middlewares/auth.js';
import { authRateLimiter } from '@middlewares/rateLimit.js';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation.js';

/**
 * Register auth routes
 */
export const authRoutes = async (fastify: FastifyInstance): Promise<void> => {
    // Register
    fastify.post(
        '/register',
        {
            preHandler: [authRateLimiter, validate({ body: registerSchema })],
        },
        registerHandler
    );

    // Login
    fastify.post(
        '/login',
        {
            preHandler: [authRateLimiter, validate({ body: loginSchema })],
        },
        loginHandler
    );

    // Refresh token
    fastify.post(
        '/refresh',
        {
            preHandler: [validate({ body: refreshTokenSchema })],
        },
        refreshHandler
    );

    // Logout
    fastify.post(
        '/logout',
        {
            preHandler: [validate({ body: refreshTokenSchema })],
        },
        logoutHandler
    );

    // Logout from all devices (requires authentication)
    fastify.post(
        '/logout-all',
        {
            preHandler: [authenticate],
        },
        logoutAllHandler
    );
};
