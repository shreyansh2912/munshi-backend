/**
 * Customers Module - Validation Schemas
 */

import Joi from 'joi';

export const createCustomerSchema = Joi.object({
    customerCode: Joi.string().max(50).optional(),
    name: Joi.string().max(255).required(),
    legalName: Joi.string().max(255).optional(),
    gstin: Joi.string().length(15).optional(),
    pan: Joi.string().length(10).optional(),
    contactPerson: Joi.string().max(200).optional(),
    email: Joi.string().email().max(255).optional(),
    phone: Joi.string().max(32).optional(),
    billingAddressLine1: Joi.string().max(255).optional(),
    billingAddressLine2: Joi.string().max(255).optional(),
    billingCity: Joi.string().max(100).optional(),
    billingState: Joi.string().max(100).optional(),
    billingPincode: Joi.string().max(10).optional(),
    billingCountry: Joi.string().length(2).default('IN'),
    shippingAddressLine1: Joi.string().max(255).optional(),
    shippingAddressLine2: Joi.string().max(255).optional(),
    shippingCity: Joi.string().max(100).optional(),
    shippingState: Joi.string().max(100).optional(),
    shippingPincode: Joi.string().max(10).optional(),
    shippingCountry: Joi.string().length(2).default('IN'),
    creditLimit: Joi.number().default(0),
    paymentTermsDays: Joi.number().default(30),
    meta: Joi.object().optional(),
});

export const updateCustomerSchema = Joi.object({
    customerCode: Joi.string().max(50).optional(),
    name: Joi.string().max(255).optional(),
    legalName: Joi.string().max(255).optional(),
    gstin: Joi.string().length(15).optional(),
    pan: Joi.string().length(10).optional(),
    contactPerson: Joi.string().max(200).optional(),
    email: Joi.string().email().max(255).optional(),
    phone: Joi.string().max(32).optional(),
    billingAddressLine1: Joi.string().max(255).optional(),
    billingAddressLine2: Joi.string().max(255).optional(),
    billingCity: Joi.string().max(100).optional(),
    billingState: Joi.string().max(100).optional(),
    billingPincode: Joi.string().max(10).optional(),
    billingCountry: Joi.string().length(2).optional(),
    shippingAddressLine1: Joi.string().max(255).optional(),
    shippingAddressLine2: Joi.string().max(255).optional(),
    shippingCity: Joi.string().max(100).optional(),
    shippingState: Joi.string().max(100).optional(),
    shippingPincode: Joi.string().max(10).optional(),
    shippingCountry: Joi.string().length(2).optional(),
    creditLimit: Joi.number().optional(),
    paymentTermsDays: Joi.number().optional(),
    isActive: Joi.boolean().optional(),
    meta: Joi.object().optional(),
});

export type CreateCustomerInput = {
    customerCode?: string;
    name: string;
    legalName?: string;
    gstin?: string;
    pan?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    billingAddressLine1?: string;
    billingAddressLine2?: string;
    billingCity?: string;
    billingState?: string;
    billingPincode?: string;
    billingCountry?: string;
    shippingAddressLine1?: string;
    shippingAddressLine2?: string;
    shippingCity?: string;
    shippingState?: string;
    shippingPincode?: string;
    shippingCountry?: string;
    creditLimit?: number;
    paymentTermsDays?: number;
    meta?: Record<string, any>;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput> & {
    isActive?: boolean;
};
