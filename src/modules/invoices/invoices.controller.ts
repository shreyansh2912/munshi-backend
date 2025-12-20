/**
 * Invoices Module - Controller
 * Handles invoice CRUD operations with pagination support
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import * as invoiceService from './invoices.service.js';
import { successJson } from '@helpers/response.js';
import type { CreateInvoiceInput, UpdateInvoiceInput } from './invoices.validation.js';

export const createInvoiceHandler = async (
    request: FastifyRequest<{ Body: CreateInvoiceInput }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const invoice = await invoiceService.createInvoice(request.user.orgId, request.user.id, request.body);

    return successJson(reply, {
        statusCode: 201,
        message: 'Invoice created successfully',
        data: invoice,
    });
};

export const getInvoiceHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const invoice = await invoiceService.getInvoice(request.params.id, request.user.orgId);

    return successJson(reply, {
        statusCode: 200,
        message: 'Invoice retrieved successfully',
        data: invoice,
    });
};

export const listInvoicesHandler = async (
    request: FastifyRequest<{
        Querystring: {
            page?: string;
            limit?: string;
            search?: string;
            status?: string;
            customerId?: string;
            dateFrom?: string;
            dateTo?: string;
        };
    }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const { page, limit, search, status, customerId, dateFrom, dateTo } = request.query;

    const result = await invoiceService.listInvoices(request.user.orgId, {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        search,
        status,
        customerId: customerId ? parseInt(customerId) : undefined,
        dateFrom,
        dateTo,
    });

    return successJson(reply, {
        statusCode: 200,
        message: 'Invoices retrieved successfully',
        data: result.data,
        pagination: result.pagination,
    });
};

export const updateInvoiceHandler = async (
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateInvoiceInput }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const invoice = await invoiceService.updateInvoice(
        request.params.id,
        request.user.orgId,
        request.body
    );

    return successJson(reply, {
        statusCode: 200,
        message: 'Invoice updated successfully',
        data: invoice,
    });
};

export const deleteInvoiceHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    await invoiceService.deleteInvoice(request.params.id, request.user.orgId);

    return successJson(reply, {
        statusCode: 200,
        message: 'Invoice deleted successfully',
    });
};
