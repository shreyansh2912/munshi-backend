/**
 * Cryptography Utilities
 * Password hashing, JWT operations, and device fingerprinting
 */

import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import { jwtConfig, passwordConfig } from '@config/security.js';
import { AuthenticationError, ErrorCode } from '@helpers/errors.js';

/**
 * JWT Payload structure
 */
export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    deviceFingerprint?: string;
}

/**
 * Hash a password using Argon2id
 *
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
    return argon2.hash(password, {
        type: passwordConfig.argon2.type,
        memoryCost: passwordConfig.argon2.memoryCost,
        timeCost: passwordConfig.argon2.timeCost,
        parallelism: passwordConfig.argon2.parallelism,
    });
};

/**
 * Verify a password against a hash
 *
 * @param hash - Hashed password
 * @param password - Plain text password to verify
 * @returns True if password matches
 */
export const verifyPassword = async (hash: string, password: string): Promise<boolean> => {
    try {
        return await argon2.verify(hash, password);
    } catch {
        return false;
    }
};

/**
 * Generate an access token
 *
 * @param payload - JWT payload
 * @returns Signed JWT token
 */
export const generateAccessToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, jwtConfig.access.secret, {
        expiresIn: jwtConfig.access.expiresIn,
        issuer: 'munshi-backend',
        audience: 'munshi-client',
    });
};

/**
 * Generate a refresh token
 *
 * @param payload - JWT payload
 * @returns Signed JWT refresh token
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, jwtConfig.refresh.secret, {
        expiresIn: jwtConfig.refresh.expiresIn,
        issuer: 'munshi-backend',
        audience: 'munshi-client',
    });
};

/**
 * Verify and decode an access token
 *
 * @param token - JWT token to verify
 * @returns Decoded payload
 * @throws AuthenticationError if token is invalid or expired
 */
export const verifyAccessToken = (token: string): JWTPayload => {
    try {
        const decoded = jwt.verify(token, jwtConfig.access.secret, {
            issuer: 'munshi-backend',
            audience: 'munshi-client',
        }) as JWTPayload;
        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new AuthenticationError('Access token expired', ErrorCode.TOKEN_EXPIRED);
        }
        throw new AuthenticationError('Invalid access token', ErrorCode.TOKEN_INVALID);
    }
};

/**
 * Verify and decode a refresh token
 *
 * @param token - Refresh token to verify
 * @returns Decoded payload
 * @throws AuthenticationError if token is invalid or expired
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
    try {
        const decoded = jwt.verify(token, jwtConfig.refresh.secret, {
            issuer: 'munshi-backend',
            audience: 'munshi-client',
        }) as JWTPayload;
        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new AuthenticationError('Refresh token expired', ErrorCode.TOKEN_EXPIRED);
        }
        throw new AuthenticationError('Invalid refresh token', ErrorCode.REFRESH_TOKEN_INVALID);
    }
};

/**
 * Generate a device fingerprint from user agent and IP
 *
 * @param userAgent - Browser user agent string
 * @param ipAddress - Client IP address
 * @returns Hashed device fingerprint
 */
export const generateDeviceFingerprint = (userAgent: string, ipAddress: string): string => {
    const data = `${userAgent}|${ipAddress}`;
    return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate a random token (for CSRF, email verification, etc.)
 *
 * @param length - Token length in bytes (default: 32)
 * @returns Random hex token
 */
export const generateRandomToken = (length = 32): string => {
    return crypto.randomBytes(length).toString('hex');
};
