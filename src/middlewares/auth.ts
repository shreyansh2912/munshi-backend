/**
 * Authentication Middleware
 * JWT verification, refresh token validation, and device fingerprinting
 */

import { FastifyRequest, FastifyReply } from 'fastify';

import { verifyAccessToken } from '@utils/crypto.js';
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
        // Extract token from header
        const token = extractToken(request.headers.authorization);
        if (!token) {
            throw new AuthenticationError('Access token is required', ErrorCode.UNAUTHORIZED);
        }

        // Verify token
        const payload = verifyAccessToken(token);

        // Get device fingerprint from header
        const deviceFingerprint = request.headers['x-device-fingerprint'] as string | undefined;

        // Verify device fingerprint if provided in token
        if (payload.deviceFingerprint && deviceFingerprint !== payload.deviceFingerprint) {
            logger.warn(
                {
                    userId: payload.userId,
                    expectedFingerprint: payload.deviceFingerprint,
                    receivedFingerprint: deviceFingerprint,
                },
                'Device fingerprint mismatch'
            );
            throw new AuthenticationError('Invalid device fingerprint', ErrorCode.UNAUTHORIZED);
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
        const token = extractToken(request.headers.authorization);
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
