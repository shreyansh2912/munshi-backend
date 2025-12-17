/**
 * Customers Module - Controller
 * Handles customer CRUD operations
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
 * List all customers
 * GET /customers
 */
export const listCustomersHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const customers = await customerService.listCustomers(request.user.orgId);

    return successJson(reply, {
        statusCode: 200,
        message: 'Customers retrieved successfully',
        data: customers,
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
