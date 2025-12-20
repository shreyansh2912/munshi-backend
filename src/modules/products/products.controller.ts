/**
 * Products Module - Controller
 * Handles product CRUD operations with pagination support
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import * as productService from './products.service.js';
import { successJson } from '@helpers/response.js';
import type { CreateProductInput, UpdateProductInput } from './products.validation.js';

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

export const listProductsHandler = async (
    request: FastifyRequest<{
        Querystring: {
            page?: string;
            limit?: string;
            search?: string;
            categoryId?: string;
            lowStock?: string;
            isActive?: string;
        };
    }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const { page, limit, search, categoryId, lowStock, isActive } = request.query;

    const result = await productService.listProducts(request.user.orgId, {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        search,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        lowStock: lowStock === 'true',
        isActive: isActive ? isActive === 'true' : undefined,
    });

    return successJson(reply, {
        statusCode: 200,
        message: 'Products retrieved successfully',
        data: result.data,
        pagination: result.pagination,
    });
};

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
