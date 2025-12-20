/**
 * Customers Module - Controller
 * Handles customer CRUD operations with pagination support
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import * as customerService from './customers.service.js';
import { successJson } from '@helpers/response.js';
import type { CreateCustomerInput, UpdateCustomerInput } from './customers.validation.js';

/**
 * Create customer
 * POST /customers
 */
export const createCustomerHandler = async (
    request: FastifyRequest<{ Body: CreateCustomerInput }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user || !request.user.orgId) {
        throw new Error('User not authenticated or missing organization');
    }

    const customer = await customerService.createCustomer(request.user.orgId, request.body);

    return successJson(reply, {
        statusCode: 201,
        message: 'Customer created successfully',
        data: customer,
    });
};

/**
 * Get customer
 * GET /customers/:id
 */
export const getCustomerHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const customer = await customerService.getCustomer(request.params.id, request.user.orgId);

    return successJson(reply, {
        statusCode: 200,
        message: 'Customer retrieved successfully',
        data: customer,
    });
};

/**
 * List all customers with pagination
 * GET /customers?page=1&limit=20&search=acme&isActive=true
 */
export const listCustomersHandler = async (
    request: FastifyRequest<{
        Querystring: {
            page?: string;
            limit?: string;
            search?: string;
            isActive?: string;
        }
    }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const { page, limit, search, isActive } = request.query;

    const result = await customerService.listCustomers(request.user.orgId, {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        search,
        isActive: isActive ? isActive === 'true' : undefined,
    });

    return successJson(reply, {
        statusCode: 200,
        message: 'Customers retrieved successfully',
        data: result.data,
        pagination: result.pagination,
    });
};

/**
 * Update customer
 * PATCH /customers/:id
 */
export const updateCustomerHandler = async (
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateCustomerInput }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const customer = await customerService.updateCustomer(
        request.params.id,
        request.user.orgId,
        request.body
    );

    return successJson(reply, {
        statusCode: 200,
        message: 'Customer updated successfully',
        data: customer,
    });
};

/**
 * Delete customer
 * DELETE /customers/:id
 */
export const deleteCustomerHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    await customerService.deleteCustomer(request.params.id, request.user.orgId);

    return successJson(reply, {
        statusCode: 200,
        message: 'Customer deleted successfully',
    });
};
