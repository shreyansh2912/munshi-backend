/**
 * Auth Module - Controller
 * HTTP handlers for authentication endpoints
 */

import { FastifyRequest, FastifyReply } from 'fastify';

import * as authService from './auth.service.js';
import { successJson } from '@helpers/response.js';
import type { RegisterInput, LoginInput, RefreshTokenInput } from './auth.validation.js';

/**
 * Register a new user
 * POST /auth/register
 */
export const registerHandler = async (
    request: FastifyRequest<{ Body: RegisterInput }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    const userAgent = request.headers['user-agent'] ?? 'Unknown';
    const ipAddress = request.ip;

    const result = await authService.register(request.body, userAgent, ipAddress);

    return successJson(reply, {
        statusCode: 201,
        message: 'User registered successfully',
        data: result,
    });
};

/**
 * Login user
 * POST /auth/login
 */
export const loginHandler = async (
    request: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    const userAgent = request.headers['user-agent'] ?? 'Unknown';
    const ipAddress = request.ip;

    const result = await authService.login(request.body, userAgent, ipAddress);

    return successJson(reply, {
        statusCode: 200,
        message: 'Login successful',
        data: result,
    });
};

/**
 * Refresh access token
 * POST /auth/refresh
 */
export const refreshHandler = async (
    request: FastifyRequest<{ Body: RefreshTokenInput }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    const userAgent = request.headers['user-agent'] ?? 'Unknown';
    const ipAddress = request.ip;

    const result = await authService.refresh(
        request.body.refreshToken,
        userAgent,
        ipAddress
    );

    return successJson(reply, {
        statusCode: 200,
        message: 'Token refreshed successfully',
        data: result,
    });
};

/**
 * Logout user
 * POST /auth/logout
 */
export const logoutHandler = async (
    request: FastifyRequest<{ Body: RefreshTokenInput }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    await authService.logout(request.body.refreshToken);

    return successJson(reply, {
        statusCode: 200,
        message: 'Logout successful',
    });
};

/**
 * Logout from all devices
 * POST /auth/logout-all
 */
export const logoutAllHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    await authService.logoutAll(request.user.id);

    return successJson(reply, {
        statusCode: 200,
        message: 'Logged out from all devices',
    });
};
