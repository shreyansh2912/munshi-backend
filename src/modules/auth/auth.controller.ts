/**
 * Auth Module - Controller
 * HTTP handlers for authentication endpoints
 */

import { FastifyRequest, FastifyReply } from 'fastify';

import * as authService from './auth.service.js';
import { successJson } from '@helpers/response.js';
import { env } from '@config/env.js';
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

    // Set cookies
    reply.setCookie('munshi_access_token', result.accessToken, {
        path: '/',
        httpOnly: true,
        secure: env.NODE_ENV === 'production', // Allow insecure cookies in development
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 minutes
    });

    reply.setCookie('munshi_refresh_token', result.refreshToken, {
        path: '/',
        httpOnly: true,
        secure: env.NODE_ENV === 'production', // Allow insecure cookies in development
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return successJson(reply, {
        statusCode: 201,
        message: 'User registered successfully',
        data: result.user,
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

    request.log.info({ userId: result.user.id }, 'Login successful, setting cookies');

    // Set cookies
    reply.setCookie('munshi_access_token', result.accessToken, {
        path: '/',
        httpOnly: true,
        secure: env.NODE_ENV === 'production', // Allow insecure cookies in development
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 minutes
    });

    reply.setCookie('munshi_refresh_token', result.refreshToken, {
        path: '/',
        httpOnly: true,
        secure: env.NODE_ENV === 'production', // Allow insecure cookies in development
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return successJson(reply, {
        statusCode: 200,
        message: 'Login successful',
        data: result.user,
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

    // Get refresh token from cookie if not in body
    const refreshToken = request.body?.refreshToken || request.cookies['munshi_refresh_token'];

    if (!refreshToken) {
        throw new Error('Refresh token is required');
    }

    const result = await authService.refresh(
        refreshToken,
        userAgent,
        ipAddress
    );

    // Set cookies
    reply.setCookie('munshi_access_token', result.accessToken, {
        path: '/',
        httpOnly: true,
        secure: env.NODE_ENV === 'production', // Allow insecure cookies in development
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 minutes
    });

    reply.setCookie('munshi_refresh_token', result.refreshToken, {
        path: '/',
        httpOnly: true,
        secure: env.NODE_ENV === 'production', // Allow insecure cookies in development
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return successJson(reply, {
        statusCode: 200,
        message: 'Token refreshed successfully',
        data: result.user,
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
    const refreshToken = request.body?.refreshToken || request.cookies['munshi_refresh_token'];

    if (refreshToken) {
        await authService.logout(refreshToken);
    }

    // Clear cookies
    reply.clearCookie('munshi_access_token', { path: '/' });
    reply.clearCookie('munshi_refresh_token', { path: '/' });

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
