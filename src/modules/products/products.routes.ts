/**
 * Products Module - Complete CRUD
 */

import { FastifyInstance } from 'fastify';
import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '@db/mysql/client.js';
import { products, productVariants } from '@db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { successJson } from '@helpers/response.js';
import { authenticate } from '@middlewares/auth.js';

// Controller handlers
const createProductHandler = async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    if (!request.user) throw new Error('User not authenticated');

    const [product] = await db.insert(products).values({
        orgId: request.user.orgId,
        uuid: uuidv4(),
        ...request.body,
    }).$returningId();

    return successJson(reply, { statusCode: 201, message: 'Product created', data: product });
};

const listProductsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) throw new Error('User not authenticated');

    const productList = await db.query.products.findMany({
        where: eq(products.orgId, request.user.orgId),
        with: { variants: true },
    });

    return successJson(reply, { statusCode: 200, message: 'Products retrieved', data: productList });
};

const getProductHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (!request.user) throw new Error('User not authenticated');

    const product = await db.query.products.findFirst({
        where: and(eq(products.id, parseInt(request.params.id)), eq(products.orgId, request.user.orgId)),
        with: { variants: true, category: true },
    });

    if (!product) return reply.status(404).send({ error: 'Product not found' });
    return successJson(reply, { statusCode: 200, message: 'Product retrieved', data: product });
};

const updateProductHandler = async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
    if (!request.user) throw new Error('User not authenticated');

    await db.update(products)
        .set(request.body)
        .where(and(eq(products.id, parseInt(request.params.id)), eq(products.orgId, request.user.orgId)));

    return successJson(reply, { statusCode: 200, message: 'Product updated' });
};

const deleteProductHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (!request.user) throw new Error('User not authenticated');

    await db.update(products)
        .set({ deletedAt: new Date() })
        .where(and(eq(products.id, parseInt(request.params.id)), eq(products.orgId, request.user.orgId)));

    return successJson(reply, { statusCode: 200, message: 'Product deleted' });
};

// Routes
export const productsRoutes = async (fastify: FastifyInstance): Promise<void> => {
    fastify.addHook('preHandler', authenticate);

    fastify.get('/', listProductsHandler);
    fastify.post('/', createProductHandler);
    fastify.get('/:id', getProductHandler);
    fastify.patch('/:id', updateProductHandler);
    fastify.delete('/:id', deleteProductHandler);
};
