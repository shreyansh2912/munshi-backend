/**
 * Ledger Module - Routes
 */

import { FastifyInstance } from 'fastify';

import {
    createLedgerHandler,
    getLedgerHandler,
    listLedgersHandler,
    updateLedgerHandler,
    deleteLedgerHandler,
} from './ledger.controller.js';
import { authenticate } from '@middlewares/auth.js';
import { validate } from '@middlewares/validate.js';
import { createLedgerSchema, updateLedgerSchema } from './ledger.validation.js';
import { idParamSchema } from '@utils/validation.js';

/**
 * Register ledger routes
 */
export const ledgerRoutes = async (fastify: FastifyInstance): Promise<void> => {
    // Create ledger account
    fastify.post(
        '/',
        {
            preHandler: [authenticate, validate({ body: createLedgerSchema })],
        },
        createLedgerHandler
    );

    // List ledger accounts
    fastify.get(
        '/',
        {
            preHandler: [authenticate],
        },
        listLedgersHandler
    );

    // Get ledger account
    fastify.get(
        '/:id',
        {
            preHandler: [authenticate, validate({ params: idParamSchema })],
        },
        getLedgerHandler
    );

    // Update ledger account
    fastify.patch(
        '/:id',
        {
            preHandler: [
                authenticate,
                validate({ params: idParamSchema, body: updateLedgerSchema }),
            ],
        },
        updateLedgerHandler
    );

    // Delete ledger account
    fastify.delete(
        '/:id',
        {
            preHandler: [authenticate, validate({ params: idParamSchema })],
        },
        deleteLedgerHandler
    );
};
