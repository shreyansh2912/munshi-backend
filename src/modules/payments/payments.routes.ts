/**
 * Payments Module - Routes
 * API endpoints for payment management
 */

import { FastifyInstance } from 'fastify';
import { authenticate } from '@middlewares/auth.js';
import {
    createPaymentHandler,
    getPaymentHandler,
    listPaymentsHandler,
    updatePaymentHandler,
    deletePaymentHandler,
    createPaymentAllocationHandler,
    getPaymentAllocationsHandler,
} from './payments.controller.js';

/**
 * Register payment routes
 * @param fastify - Fastify instance
 */
export const paymentsRoutes = async (fastify: FastifyInstance): Promise<void> => {
    // Apply authentication to all routes
    fastify.addHook('preHandler', authenticate);

    // Payment CRUD routes
    fastify.get('/', listPaymentsHandler);
    fastify.post('/', createPaymentHandler);
    fastify.get('/:id', getPaymentHandler);
    fastify.patch('/:id', updatePaymentHandler);
    fastify.delete('/:id', deletePaymentHandler);

    // Payment allocation routes
    fastify.post('/:id/allocations', createPaymentAllocationHandler);
    fastify.get('/:id/allocations', getPaymentAllocationsHandler);
};
