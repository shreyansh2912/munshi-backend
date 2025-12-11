/**
 * Ledger Module - Controller
 */

import { FastifyRequest, FastifyReply } from 'fastify';

import * as ledgerService from './ledger.service.js';
import { successJson } from '@helpers/response.js';
import type { CreateLedgerInput, UpdateLedgerInput } from './ledger.validation.js';

/**
 * Create ledger account
 * POST /ledger
 */
export const createLedgerHandler = async (
    request: FastifyRequest<{ Body: CreateLedgerInput }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const ledger = await ledgerService.createLedger(request.user.id, request.body);

    return successJson(reply, {
        statusCode: 201,
        message: 'Ledger account created successfully',
        data: ledger,
    });
};

/**
 * Get ledger account
 * GET /ledger/:id
 */
export const getLedgerHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const ledger = await ledgerService.getLedger(request.params.id, request.user.id);

    return successJson(reply, {
        statusCode: 200,
        message: 'Ledger account retrieved successfully',
        data: ledger,
    });
};

/**
 * List all ledger accounts
 * GET /ledger
 */
export const listLedgersHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const ledgers = await ledgerService.listLedgers(request.user.id);

    return successJson(reply, {
        statusCode: 200,
        message: 'Ledger accounts retrieved successfully',
        data: ledgers,
    });
};

/**
 * Update ledger account
 * PATCH /ledger/:id
 */
export const updateLedgerHandler = async (
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateLedgerInput }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const ledger = await ledgerService.updateLedger(
        request.params.id,
        request.user.id,
        request.body
    );

    return successJson(reply, {
        statusCode: 200,
        message: 'Ledger account updated successfully',
        data: ledger,
    });
};

/**
 * Delete ledger account
 * DELETE /ledger/:id
 */
export const deleteLedgerHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    await ledgerService.deleteLedger(request.params.id, request.user.id);

    return successJson(reply, {
        statusCode: 200,
        message: 'Ledger account deleted successfully',
    });
};
