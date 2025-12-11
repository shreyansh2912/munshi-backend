/**
 * Common Validation Schemas and Utilities
 * Reusable Zod schemas and validation helpers
 */

import { z } from 'zod';

/**
 * Common field validators
 */

// Email validation
export const emailSchema = z.string().email('Invalid email format').toLowerCase();

// Password validation - strong password requirements
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Positive integer
export const positiveIntSchema = z.number().int().positive('Must be a positive integer');

// Non-negative integer
export const nonNegativeIntSchema = z.number().int().nonnegative('Must be a non-negative integer');

// Positive decimal
export const positiveDecimalSchema = z.number().positive('Must be a positive number');

// Date string (ISO 8601)
export const dateStringSchema = z.string().datetime('Invalid date format');

// Phone number (basic validation)
export const phoneSchema = z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

// URL validation
export const urlSchema = z.string().url('Invalid URL format');

/**
 * Pagination schemas
 */
export const paginationSchema = z.object({
    page: z
        .string()
        .optional()
        .default('1')
        .transform((val) => parseInt(val, 10))
        .pipe(z.number().int().positive()),
    limit: z
        .string()
        .optional()
        .default('10')
        .transform((val) => parseInt(val, 10))
        .pipe(z.number().int().positive().max(100)),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Search query schema
 */
export const searchSchema = z.object({
    q: z.string().min(1, 'Search query is required'),
});

/**
 * ID parameter schema
 */
export const idParamSchema = z.object({
    id: uuidSchema,
});

/**
 * Sanitize string input
 * Removes potentially dangerous characters
 *
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export const sanitizeString = (input: string): string => {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Sanitize object recursively
 * Sanitizes all string values in an object
 *
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export const sanitizeObject = <T extends Record<string, unknown>>(obj: T): T => {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[key] = sanitizeObject(value as Record<string, unknown>);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map((item) =>
                typeof item === 'string'
                    ? sanitizeString(item)
                    : typeof item === 'object' && item !== null
                        ? sanitizeObject(item as Record<string, unknown>)
                        : item
            );
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized as T;
};
