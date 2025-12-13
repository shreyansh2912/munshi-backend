/**
 * Auth Module - Validation Schemas
 * Zod schemas for authentication endpoints
 */

import { z } from 'zod';

import { emailSchema, passwordSchema } from '@utils/validation.js';

/**
 * Register request schema
 */
export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
});

/**
 * Login request schema
 */
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
});

/**
 * Refresh token request schema
 */
export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required').optional(),
});

/**
 * Type exports
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
