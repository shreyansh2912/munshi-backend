/**
 * Customers Module - Validation Schemas
 */

import { z } from 'zod';

export const createCustomerSchema = z.object({
    customerCode: z.string().max(50).optional(),
    name: z.string().max(255),
    legalName: z.string().max(255).optional(),
    gstin: z.string().length(15).optional(),
    pan: z.string().length(10).optional(),
    contactPerson: z.string().max(200).optional(),
    email: z.string().email().max(255).optional(),
    phone: z.string().max(32).optional(),
    billingAddressLine1: z.string().max(255).optional(),
    billingAddressLine2: z.string().max(255).optional(),
    billingCity: z.string().max(100).optional(),
    billingState: z.string().max(100).optional(),
    billingPincode: z.string().max(10).optional(),
    billingCountry: z.string().length(2).default('IN'),
    shippingAddressLine1: z.string().max(255).optional(),
    shippingAddressLine2: z.string().max(255).optional(),
    shippingCity: z.string().max(100).optional(),
    shippingState: z.string().max(100).optional(),
    shippingPincode: z.string().max(10).optional(),
    shippingCountry: z.string().length(2).default('IN'),
    creditLimit: z.number().default(0),
    paymentTermsDays: z.number().default(30),
    meta: z.record(z.any()).optional(),
});

export const updateCustomerSchema = z.object({
    customerCode: z.string().max(50).optional(),
    name: z.string().max(255).optional(),
    legalName: z.string().max(255).optional(),
    gstin: z.string().length(15).optional(),
    pan: z.string().length(10).optional(),
    contactPerson: z.string().max(200).optional(),
    email: z.string().email().max(255).optional(),
    phone: z.string().max(32).optional(),
    billingAddressLine1: z.string().max(255).optional(),
    billingAddressLine2: z.string().max(255).optional(),
    billingCity: z.string().max(100).optional(),
    billingState: z.string().max(100).optional(),
    billingPincode: z.string().max(10).optional(),
    billingCountry: z.string().length(2).optional(),
    shippingAddressLine1: z.string().max(255).optional(),
    shippingAddressLine2: z.string().max(255).optional(),
    shippingCity: z.string().max(100).optional(),
    shippingState: z.string().max(100).optional(),
    shippingPincode: z.string().max(10).optional(),
    shippingCountry: z.string().length(2).optional(),
    creditLimit: z.number().optional(),
    paymentTermsDays: z.number().optional(),
    isActive: z.boolean().optional(),
    meta: z.record(z.any()).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
