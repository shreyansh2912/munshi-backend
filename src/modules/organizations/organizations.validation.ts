/**
 * Organizations Module - Validation Schemas
 */

import { z } from 'zod';

/**
 * Schema for creating an organization
 */
export const createOrganizationSchema = z.object({
    name: z.string().max(255),
    legalName: z.string().max(255).optional(),
    gstin: z.string().length(15).optional(),
    pan: z.string().length(10).optional(),
    tan: z.string().max(20).optional(),
    cin: z.string().max(21).optional(),
    businessType: z.enum(['proprietorship', 'partnership', 'llp', 'private_limited', 'public_limited', 'other']).optional(),
    industry: z.string().max(100).optional(),
    currency: z.string().length(3).default('INR'),
    timezone: z.string().max(50).default('Asia/Kolkata'),
    fiscalYearStartMonth: z.number().min(1).max(12).default(4),
    addressLine1: z.string().max(255).optional(),
    addressLine2: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    pincode: z.string().max(10).optional(),
    country: z.string().length(2).default('IN'),
    logoUrl: z.string().max(500).optional(),
    website: z.string().max(255).optional(),
    email: z.string().email().max(255).optional(),
    phone: z.string().max(32).optional(),
});

/**
 * Schema for updating an organization
 */
export const updateOrganizationSchema = z.object({
    name: z.string().max(255).optional(),
    legalName: z.string().max(255).optional(),
    gstin: z.string().length(15).optional(),
    pan: z.string().length(10).optional(),
    tan: z.string().max(20).optional(),
    cin: z.string().max(21).optional(),
    businessType: z.enum(['proprietorship', 'partnership', 'llp', 'private_limited', 'public_limited', 'other']).optional(),
    industry: z.string().max(100).optional(),
    currency: z.string().length(3).optional(),
    timezone: z.string().max(50).optional(),
    fiscalYearStartMonth: z.number().min(1).max(12).optional(),
    addressLine1: z.string().max(255).optional(),
    addressLine2: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    pincode: z.string().max(10).optional(),
    country: z.string().length(2).optional(),
    logoUrl: z.string().max(500).optional(),
    website: z.string().max(255).optional(),
    email: z.string().email().max(255).optional(),
    phone: z.string().max(32).optional(),
    isActive: z.boolean().optional(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
