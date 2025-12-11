/**
 * Auth Module - Service
 * Business logic for authentication
 */

import { User } from '@prisma/client';

import {
    hashPassword,
    verifyPassword,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    generateDeviceFingerprint,
} from '@utils/crypto.js';
import {
    createUser,
    findUserByEmail,
    createRefreshToken,
    findRefreshToken,
    deleteRefreshToken,
    deleteUserRefreshTokens,
    upsertDeviceFingerprint,
    cleanupOldDeviceFingerprints,
} from './auth.repository.js';
import {
    ConflictError,
    AuthenticationError,
    ErrorCode,
    NotFoundError,
} from '@helpers/errors.js';
import { sessionConfig } from '@config/security.js';
import { logger } from '@config/logger.js';
import type { RegisterInput, LoginInput } from './auth.validation.js';

/**
 * Auth response with tokens
 */
export interface AuthResponse {
    user: Omit<User, 'password'>;
    accessToken: string;
    refreshToken: string;
}

/**
 * Register a new user
 */
export const register = async (
    data: RegisterInput,
    userAgent: string,
    ipAddress: string
): Promise<AuthResponse> => {
    // Check if user already exists
    const existingUser = await findUserByEmail(data.email);
    if (existingUser) {
        throw new ConflictError('Email already registered', ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await createUser({
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
    });

    logger.info({ userId: user.id, email: user.email }, 'User registered');

    // Generate device fingerprint
    const deviceFingerprint = generateDeviceFingerprint(userAgent, ipAddress);

    // Store device fingerprint
    await upsertDeviceFingerprint(user.id, deviceFingerprint, userAgent, ipAddress);

    // Generate tokens
    const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        deviceFingerprint,
    });

    const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        deviceFingerprint,
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await createRefreshToken({
        token: refreshToken,
        user: { connect: { id: user.id } },
        deviceFingerprint,
        expiresAt,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
    };
};

/**
 * Login user
 */
export const login = async (
    data: LoginInput,
    userAgent: string,
    ipAddress: string
): Promise<AuthResponse> => {
    // Find user
    const user = await findUserByEmail(data.email);
    if (!user) {
        throw new AuthenticationError('Invalid credentials', ErrorCode.INVALID_CREDENTIALS);
    }

    // Verify password
    const isValidPassword = await verifyPassword(user.password, data.password);
    if (!isValidPassword) {
        throw new AuthenticationError('Invalid credentials', ErrorCode.INVALID_CREDENTIALS);
    }

    // Check if user is active
    if (!user.isActive) {
        throw new AuthenticationError('Account is inactive', ErrorCode.FORBIDDEN);
    }

    logger.info({ userId: user.id, email: user.email }, 'User logged in');

    // Generate device fingerprint
    const deviceFingerprint = generateDeviceFingerprint(userAgent, ipAddress);

    // Store device fingerprint
    await upsertDeviceFingerprint(user.id, deviceFingerprint, userAgent, ipAddress);

    // Cleanup old devices (keep only latest 5)
    await cleanupOldDeviceFingerprints(user.id, sessionConfig.maxDevices);

    // Generate tokens
    const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        deviceFingerprint,
    });

    const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        deviceFingerprint,
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await createRefreshToken({
        token: refreshToken,
        user: { connect: { id: user.id } },
        deviceFingerprint,
        expiresAt,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
    };
};

/**
 * Refresh access token
 */
export const refresh = async (
    token: string,
    userAgent: string,
    ipAddress: string
): Promise<AuthResponse> => {
    // Verify refresh token
    const payload = verifyRefreshToken(token);

    // Find refresh token in database
    const storedToken = await findRefreshToken(token);
    if (!storedToken) {
        throw new AuthenticationError(
            'Invalid refresh token',
            ErrorCode.REFRESH_TOKEN_INVALID
        );
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
        await deleteRefreshToken(token);
        throw new AuthenticationError('Refresh token expired', ErrorCode.TOKEN_EXPIRED);
    }

    // Verify device fingerprint
    const deviceFingerprint = generateDeviceFingerprint(userAgent, ipAddress);
    if (storedToken.deviceFingerprint !== deviceFingerprint) {
        logger.warn(
            {
                userId: payload.userId,
                expectedFingerprint: storedToken.deviceFingerprint,
                receivedFingerprint: deviceFingerprint,
            },
            'Device fingerprint mismatch during refresh'
        );
        throw new AuthenticationError('Invalid device', ErrorCode.UNAUTHORIZED);
    }

    // Get user
    const user = await findUserByEmail(payload.email);
    if (!user || !user.isActive) {
        throw new NotFoundError('User not found or inactive');
    }

    // Delete old refresh token
    await deleteRefreshToken(token);

    // Generate new tokens
    const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        deviceFingerprint,
    });

    const newRefreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        deviceFingerprint,
    });

    // Store new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await createRefreshToken({
        token: newRefreshToken,
        user: { connect: { id: user.id } },
        deviceFingerprint,
        expiresAt,
    });

    logger.info({ userId: user.id }, 'Token refreshed');

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
        user: userWithoutPassword,
        accessToken,
        refreshToken: newRefreshToken,
    };
};

/**
 * Logout user
 */
export const logout = async (refreshToken: string): Promise<void> => {
    await deleteRefreshToken(refreshToken);
    logger.info('User logged out');
};

/**
 * Logout from all devices
 */
export const logoutAll = async (userId: string): Promise<void> => {
    await deleteUserRefreshTokens(userId);
    logger.info({ userId }, 'User logged out from all devices');
};
