/**
 * Files Module - Validation Schemas
 */

import { z } from 'zod';

/**
 * Schema for file upload
 */
export const uploadFileSchema = z.object({
    visibility: z.enum(['public', 'private']).default('private'),
    disk: z.enum(['local', 's3', 'public']).optional(),
});

/**
 * Schema for updating file visibility
 */
export const updateVisibilitySchema = z.object({
    visibility: z.enum(['public', 'private']),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type UpdateVisibilityInput = z.infer<typeof updateVisibilitySchema>;
