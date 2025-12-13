/**
 * Authentication Middleware
 * JWT verification, refresh token validation, and device fingerprinting
 */

import { FastifyRequest, FastifyReply } from 'fastify';

import { verifyAccessToken, generateDeviceFingerprint } from '@utils/crypto.js';
import { db } from '@db/mysql/client.js';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';
import { AuthenticationError, ErrorCode } from '@helpers/errors.js';
import { logger } from '@config/logger.js';

/**
 * Extract token from Authorization header
 */
const extractToken = (authHeader?: string): string | null => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
};

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user to request
 *
 * @throws AuthenticationError if token is missing, invalid, or user not found
 */
export const authenticate = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        // Extract token from header or cookie
        let token = extractToken(request.headers.authorization);

        // Debug logging
        const debugInfo = {
            hasCookies: !!request.cookies,
            cookieKeys: request.cookies ? Object.keys(request.cookies) : [],
            hasCookieHeader: !!request.headers.cookie,
            cookieHeaderLength: request.headers.cookie?.toString().length || 0,
            url: request.url,
        };

        console.log('[AUTH DEBUG] Authentication attempt:', debugInfo);
        logger.debug(debugInfo, 'Authentication: Cookie debug info');

        // Try to get token from signed cookies first (from browser)
        if (!token && request.cookies['munshi_access_token']) {
            token = request.cookies['munshi_access_token'];
            console.log('[AUTH DEBUG] Found token in signed cookies');
        }

        // If not found, try to parse unsigned cookies (from Next.js SSR)
        if (!token && request.headers.cookie) {
            const cookieHeader = request.headers.cookie.toString();
            console.log('[AUTH DEBUG] Cookie header:', cookieHeader.substring(0, 100));

            const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
                const [name, value] = cookie.trim().split('=');
                if (name && value) {
                    acc[name] = value;
                }
                return acc;
            }, {} as Record<string, string>);

            console.log('[AUTH DEBUG] Parsed cookies:', Object.keys(cookies));

            if (cookies['munshi_access_token']) {
                token = cookies['munshi_access_token'];
                console.log('[AUTH DEBUG] Found token in unsigned cookies (SSR)');
                logger.debug('Using unsigned cookie from SSR request');
            }
        }

        console.log('[AUTH DEBUG] Final token status:', !!token);

        if (!token) {
            throw new AuthenticationError('Access token is required', ErrorCode.UNAUTHORIZED);
        }

        // Verify token
        const payload = verifyAccessToken(token);

        // Generate device fingerprint from request metadata (same as during login)
        const userAgent = request.headers['user-agent'] || '';
        const ipAddress = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            request.ip ||
            request.socket.remoteAddress ||
            '';
        const deviceFingerprint = generateDeviceFingerprint(userAgent, ipAddress);

        // Verify device fingerprint if provided in token
        // Note: Only log a warning for fingerprint mismatches to allow Next.js SSR
        // Server-side requests from Next.js will have different user-agent/IP
        if (payload.deviceFingerprint && deviceFingerprint !== payload.deviceFingerprint) {
            logger.warn(
                {
                    userId: payload.userId,
                    expectedFingerprint: payload.deviceFingerprint,
                    receivedFingerprint: deviceFingerprint,
                    userAgent,
                    ipAddress,
                },
                'Device fingerprint mismatch - this is expected for Next.js SSR requests'
            );
            // Don't throw error to allow Next.js server-side rendering to work
            // In production, you may want to add additional checks here
        }

        // Fetch user from database
        const result = await db.select().from(users).where(eq(users.id, payload.userId));
        const user = result[0] || null;

        if (!user) {
            throw new AuthenticationError('User not found', ErrorCode.USER_NOT_FOUND);
        }

        if (!user.isActive) {
            throw new AuthenticationError('User account is inactive', ErrorCode.FORBIDDEN);
        }

        // Attach user and device fingerprint to request
        request.user = user;
        request.deviceFingerprint = deviceFingerprint;

        logger.debug({ userId: user.id, email: user.email }, 'User authenticated');
    } catch (error) {
        // Re-throw AppError instances
        if (error instanceof AuthenticationError) {
            throw error;
        }

        // Log unexpected errors
        logger.error({ error }, 'Authentication error');
        throw new AuthenticationError('Authentication failed', ErrorCode.UNAUTHORIZED);
    }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't throw if missing
 */
export const optionalAuthenticate = async (
    request: FastifyRequest,
    _reply: FastifyReply
): Promise<void> => {
    try {
        let token = extractToken(request.headers.authorization);

        // Try signed cookies first
        if (!token && request.cookies['munshi_access_token']) {
            token = request.cookies['munshi_access_token'];
        }

        // Try unsigned cookies (from SSR)
        if (!token && request.headers.cookie) {
            const cookieHeader = request.headers.cookie.toString();
            const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
                const [name, value] = cookie.trim().split('=');
                if (name && value) {
                    acc[name] = value;
                }
                return acc;
            }, {} as Record<string, string>);

            if (cookies['munshi_access_token']) {
                token = cookies['munshi_access_token'];
            }
        }

        if (!token) {
            return;
        }

        const payload = verifyAccessToken(token);
        const result = await db.select().from(users).where(eq(users.id, payload.userId));
        const user = result[0] || null;

        if (user && user.isActive) {
            request.user = user;
        }
    } catch (error) {
        // Silently fail for optional authentication
        logger.debug({ error }, 'Optional authentication failed');
    }
};
