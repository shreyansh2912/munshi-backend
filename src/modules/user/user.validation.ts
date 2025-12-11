/**
 * User Module - Validation Schemas
 */

import { z } from 'zod';

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
});

/**
 * Type exports
 */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
