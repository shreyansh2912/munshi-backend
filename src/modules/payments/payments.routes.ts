/**
 * Payments Module - Complete CRUD
 */

import { FastifyInstance } from 'fastify';
import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '@db/mysql/client.js';
import { payments, paymentAllocations } from '@db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { successJson } from '@helpers/response.js';
import { authenticate } from '@middlewares/auth.js';

interface CreatePaymentBody {
    paymentNumber: string;
    paymentType: 'receipt' | 'payment';
    paymentDate: Date;
    partyType: 'customer' | 'supplier' | 'other';
    partyId: number;
    amount: number;
    currency?: string;
    exchangeRate?: string;
    paymentMethod: 'cash' | 'bank_transfer' | 'upi' | 'card' | 'cheque' | 'dd' | 'other';
    bankAccountId?: number;
    referenceNumber?: string;
    chequeNumber?: string;
    chequeDate?: Date;
    upiTransactionId?: string;
    notes?: string;
    status?: 'pending' | 'cleared' | 'bounced' | 'cancelled';
    clearedAt?: Date;
    journalEntryId?: number;
}

const createPaymentHandler = async (request: FastifyRequest<{ Body: CreatePaymentBody }>, reply: FastifyReply) => {
    if (!request.user) throw new Error('User not authenticated');

    const [payment] = await db.insert(payments).values({
        orgId: request.user.orgId,
        uuid: uuidv4(),
        createdBy: request.user.id,
        ...request.body,
    }).$returningId();

    return successJson(reply, { statusCode: 201, message: 'Payment created', data: payment });
};

const listPaymentsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) throw new Error('User not authenticated');

    const paymentList = await db.query.payments.findMany({
        where: eq(payments.orgId, request.user.orgId),
        orderBy: (payments, { desc }) => [desc(payments.createdAt)],
    });

    return successJson(reply, { statusCode: 200, message: 'Payments retrieved', data: paymentList });
};

const getPaymentHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (!request.user) throw new Error('User not authenticated');

    const payment = await db.query.payments.findFirst({
        where: and(eq(payments.id, parseInt(request.params.id)), eq(payments.orgId, request.user.orgId)),
    });

    if (!payment) return reply.status(404).send({ error: 'Payment not found' });
    return successJson(reply, { statusCode: 200, message: 'Payment retrieved', data: payment });
};

const updatePaymentHandler = async (request: FastifyRequest<{ Params: { id: string }; Body: Partial<CreatePaymentBody> }>, reply: FastifyReply) => {
    if (!request.user) throw new Error('User not authenticated');

    await db.update(payments)
        .set(request.body)
        .where(and(eq(payments.id, parseInt(request.params.id)), eq(payments.orgId, request.user.orgId)));

    return successJson(reply, { statusCode: 200, message: 'Payment updated' });
};

export const paymentsRoutes = async (fastify: FastifyInstance): Promise<void> => {
    fastify.addHook('preHandler', authenticate);

    fastify.get('/', listPaymentsHandler);
    fastify.post('/', createPaymentHandler);
    fastify.get('/:id', getPaymentHandler);
    fastify.patch('/:id', updatePaymentHandler);
};
