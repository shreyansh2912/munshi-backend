/**
 * Invoices Module - Validation
 */

import Joi from 'joi';

export const createInvoiceSchema = Joi.object({
    invoiceNumber: Joi.string().max(100).required(),
    invoiceType: Joi.string().valid('tax_invoice', 'proforma', 'credit_note', 'debit_note', 'export_invoice').default('tax_invoice'),
    customerId: Joi.number().required(),
    invoiceDate: Joi.date().required(),
    dueDate: Joi.date().optional(),
    placeOfSupply: Joi.string().max(100).optional(),
    isReverseCharge: Joi.boolean().default(false),
    isExport: Joi.boolean().default(false),
    currency: Joi.string().length(3).default('INR'),
    subtotal: Joi.number().default(0),
    discountAmount: Joi.number().default(0),
    taxableAmount: Joi.number().default(0),
    taxAmount: Joi.number().default(0),
    roundOff: Joi.number().default(0),
    totalAmount: Joi.number().required(),
    notes: Joi.string().optional(),
    termsAndConditions: Joi.string().optional(),
});

export const updateInvoiceSchema = Joi.object({
    invoiceNumber: Joi.string().max(100).optional(),
    invoiceType: Joi.string().valid('tax_invoice', 'proforma', 'credit_note', 'debit_note', 'export_invoice').optional(),
    customerId: Joi.number().optional(),
    invoiceDate: Joi.date().optional(),
    dueDate: Joi.date().optional(),
    placeOfSupply: Joi.string().max(100).optional(),
    isReverseCharge: Joi.boolean().optional(),
    isExport: Joi.boolean().optional(),
    currency: Joi.string().length(3).optional(),
    subtotal: Joi.number().optional(),
    discountAmount: Joi.number().optional(),
    taxableAmount: Joi.number().optional(),
    taxAmount: Joi.number().optional(),
    roundOff: Joi.number().optional(),
    totalAmount: Joi.number().optional(),
    amountPaid: Joi.number().optional(),
    balanceDue: Joi.number().optional(),
    status: Joi.string().valid('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled', 'void').optional(),
    paymentStatus: Joi.string().valid('unpaid', 'partially_paid', 'paid').optional(),
    notes: Joi.string().optional(),
    termsAndConditions: Joi.string().optional(),
});

export type CreateInvoiceInput = {
    invoiceNumber: string;
    invoiceType?: string;
    customerId: number;
    invoiceDate: Date;
    dueDate?: Date;
    placeOfSupply?: string;
    isReverseCharge?: boolean;
    isExport?: boolean;
    currency?: string;
    subtotal?: number;
    discountAmount?: number;
    taxableAmount?: number;
    taxAmount?: number;
    roundOff?: number;
    totalAmount: number;
    notes?: string;
    termsAndConditions?: string;
};

export type UpdateInvoiceInput = Partial<CreateInvoiceInput> & {
    amountPaid?: number;
    balanceDue?: number;
    status?: string;
    paymentStatus?: string;
};
