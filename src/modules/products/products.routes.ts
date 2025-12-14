/**
 * Products Module - Routes
 * API endpoints for product management
 */

import { FastifyInstance } from 'fastify';
import { authenticate } from '@middlewares/auth.js';
import {
    createProductHandler,
    getProductHandler,
    listProductsHandler,
    updateProductHandler,
    deleteProductHandler,
    listCategoriesHandler,
    listUnitsHandler,
} from './products.controller.js';

/**
 * Register product routes
 * @param fastify - Fastify instance
 */
export const productsRoutes = async (fastify: FastifyInstance): Promise<void> => {
    // Apply authentication to all routes
    fastify.addHook('preHandler', authenticate);

    // Product CRUD routes
    fastify.get('/', listProductsHandler);
    fastify.post('/', createProductHandler);
    fastify.get('/:id', getProductHandler);
    fastify.patch('/:id', updateProductHandler);
    fastify.delete('/:id', deleteProductHandler);

    // Category and unit routes
    fastify.get('/categories', listCategoriesHandler);
    fastify.get('/units', listUnitsHandler);
};
