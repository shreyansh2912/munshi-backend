/**
 * Invoices Module - Routes
 */

import { FastifyInstance } from 'fastify';
import {
    createInvoiceHandler,
    getInvoiceHandler,
    listInvoicesHandler,
    updateInvoiceHandler,
    deleteInvoiceHandler,
} from './invoices.controller.js';
import { validate } from '@middlewares/validate.js';
import { authenticate } from '@middlewares/auth.js';
import { createInvoiceSchema, updateInvoiceSchema } from './invoices.validation.js';

export const invoicesRoutes = async (fastify: FastifyInstance): Promise<void> => {
    fastify.addHook('preHandler', authenticate);

    fastify.get('/', listInvoicesHandler);
    fastify.post('/', { preHandler: [validate({ body: createInvoiceSchema })] }, createInvoiceHandler);
    fastify.get('/:id', getInvoiceHandler);
    fastify.patch('/:id', { preHandler: [validate({ body: updateInvoiceSchema })] }, updateInvoiceHandler);
    fastify.delete('/:id', deleteInvoiceHandler);
};
