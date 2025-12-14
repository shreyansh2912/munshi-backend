/**
 * Products Module - Controller
 * Handles product CRUD operations and related endpoints
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import * as productService from './products.service.js';
import { successJson } from '@helpers/response.js';
import type { CreateProductInput, UpdateProductInput } from './products.validation.js';

/**
 * Create product
 * POST /products
 */
export const createProductHandler = async (
    request: FastifyRequest<{ Body: CreateProductInput }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const product = await productService.createProduct(request.user.orgId, request.body);

    return successJson(reply, {
        statusCode: 201,
        message: 'Product created successfully',
        data: product,
    });
};

/**
 * Get product
 * GET /products/:id
 */
export const getProductHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const product = await productService.getProduct(request.params.id, request.user.orgId);

    return successJson(reply, {
        statusCode: 200,
        message: 'Product retrieved successfully',
        data: product,
    });
};

/**
 * List all products
 * GET /products
 */
export const listProductsHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const products = await productService.listProducts(request.user.orgId);

    return successJson(reply, {
        statusCode: 200,
        message: 'Products retrieved successfully',
        data: products,
    });
};

/**
 * Update product
 * PATCH /products/:id
 */
export const updateProductHandler = async (
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateProductInput }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const product = await productService.updateProduct(
        request.params.id,
        request.user.orgId,
        request.body
    );

    return successJson(reply, {
        statusCode: 200,
        message: 'Product updated successfully',
        data: product,
    });
};

/**
 * Delete product
 * DELETE /products/:id
 */
export const deleteProductHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    await productService.deleteProduct(request.params.id, request.user.orgId);

    return successJson(reply, {
        statusCode: 200,
        message: 'Product deleted successfully',
    });
};

/**
 * List product categories
 * GET /products/categories
 */
export const listCategoriesHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const categories = await productService.listCategories(request.user.orgId);

    return successJson(reply, {
        statusCode: 200,
        message: 'Categories retrieved successfully',
        data: categories,
    });
};

/**
 * List units
 * GET /products/units
 */
export const listUnitsHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const units = await productService.listUnits(request.user.orgId);

    return successJson(reply, {
        statusCode: 200,
        message: 'Units retrieved successfully',
        data: units,
    });
};
