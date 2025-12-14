/**
 * Products Module - Validation Schemas
 */

import { z } from 'zod';

/**
 * Schema for creating a product
 */
export const createProductSchema = z.object({
    sku: z.string().max(100),
    name: z.string().max(255),
    description: z.string().max(1000).optional(),
    categoryId: z.number().optional(),
    hsnCode: z.string().max(50).optional(),
    sacCode: z.string().max(50).optional(),
    productType: z.enum(['goods', 'service']).default('goods'),
    unitId: z.number().optional(),
    hasVariants: z.boolean().default(false),
    trackInventory: z.boolean().default(true),
    meta: z.record(z.any()).optional(),
});

/**
 * Schema for updating a product
 */
export const updateProductSchema = z.object({
    sku: z.string().max(100).optional(),
    name: z.string().max(255).optional(),
    description: z.string().max(1000).optional(),
    categoryId: z.number().optional(),
    hsnCode: z.string().max(50).optional(),
    sacCode: z.string().max(50).optional(),
    productType: z.enum(['goods', 'service']).optional(),
    unitId: z.number().optional(),
    hasVariants: z.boolean().optional(),
    trackInventory: z.boolean().optional(),
    isActive: z.boolean().optional(),
    meta: z.record(z.any()).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
