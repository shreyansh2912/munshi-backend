/**
 * Payments Module - Controller
 * Handles payment CRUD operations and allocations
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import * as paymentService from './payments.service.js';
import { successJson } from '@helpers/response.js';
import type { CreatePaymentInput, UpdatePaymentInput, CreatePaymentAllocationInput } from './payments.validation.js';

/**
 * Create payment
 * POST /payments
 */
export const createPaymentHandler = async (
    request: FastifyRequest<{ Body: CreatePaymentInput }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const payment = await paymentService.createPayment(
        request.user.orgId,
        request.user.id,
        request.body
    );

    return successJson(reply, {
        statusCode: 201,
        message: 'Payment created successfully',
        data: payment,
    });
};

/**
 * Get payment
 * GET /payments/:id
 */
export const getPaymentHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const payment = await paymentService.getPayment(request.params.id, request.user.orgId);

    return successJson(reply, {
        statusCode: 200,
        message: 'Payment retrieved successfully',
        data: payment,
    });
};

/**
 * List all payments
 * GET /payments
 */
export const listPaymentsHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const payments = await paymentService.listPayments(request.user.orgId);

    return successJson(reply, {
        statusCode: 200,
        message: 'Payments retrieved successfully',
        data: payments,
    });
};

/**
 * Update payment
 * PATCH /payments/:id
 */
export const updatePaymentHandler = async (
    request: FastifyRequest<{ Params: { id: string }; Body: UpdatePaymentInput }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const payment = await paymentService.updatePayment(
        request.params.id,
        request.user.orgId,
        request.body
    );

    return successJson(reply, {
        statusCode: 200,
        message: 'Payment updated successfully',
        data: payment,
    });
};

/**
 * Delete payment
 * DELETE /payments/:id
 */
export const deletePaymentHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    await paymentService.deletePayment(request.params.id, request.user.orgId);

    return successJson(reply, {
        statusCode: 200,
        message: 'Payment deleted successfully',
    });
};

/**
 * Create payment allocation
 * POST /payments/:id/allocations
 */
export const createPaymentAllocationHandler = async (
    request: FastifyRequest<{ Params: { id: string }; Body: CreatePaymentAllocationInput }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const allocation = await paymentService.createPaymentAllocation(
        parseInt(request.params.id),
        request.user.orgId,
        request.body
    );

    return successJson(reply, {
        statusCode: 201,
        message: 'Payment allocation created successfully',
        data: allocation,
    });
};

/**
 * Get payment allocations
 * GET /payments/:id/allocations
 */
export const getPaymentAllocationsHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const allocations = await paymentService.getPaymentAllocations(
        parseInt(request.params.id),
        request.user.orgId
    );

    return successJson(reply, {
        statusCode: 200,
        message: 'Payment allocations retrieved successfully',
        data: allocations,
    });
};
