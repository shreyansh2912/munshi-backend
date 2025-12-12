/**
 * Customers Module - Routes
 */

import { FastifyInstance } from 'fastify';
import {
    createCustomerHandler,
    getCustomerHandler,
    listCustomersHandler,
    updateCustomerHandler,
    deleteCustomerHandler,
} from './customers.controller.js';
import { validate } from '@middlewares/validate.js';
import { authenticate } from '@middlewares/auth.js';
import { createCustomerSchema, updateCustomerSchema } from './customers.validation.js';

export const customersRoutes = async (fastify: FastifyInstance): Promise<void> => {
    // All routes require authentication
    fastify.addHook('preHandler', authenticate);

    // List customers
    fastify.get('/', listCustomersHandler);

    // Create customer
    fastify.post(
        '/',
        {
            preHandler: [validate({ body: createCustomerSchema })],
        },
        createCustomerHandler
    );

    // Get customer
    fastify.get('/:id', getCustomerHandler);

    // Update customer
    fastify.patch(
        '/:id',
        {
            preHandler: [validate({ body: updateCustomerSchema })],
        },
        updateCustomerHandler
    );

    // Delete customer
    fastify.delete('/:id', deleteCustomerHandler);
};
