/**
 * Products Module - Service
 * Business logic for product operations
 */

import { db } from '@db/mysql/client.js';
import { products, productCategories, units } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { CreateProductInput, UpdateProductInput } from './products.validation.js';
import { NotFoundError } from '@helpers/errors.js';

/**
 * Create a new product
 * @param orgId - Organization ID
 * @param data - Product creation data
 * @returns Created product with relations
 */
export const createProduct = async (orgId: number, data: CreateProductInput) => {
    const [product] = await db
        .insert(products)
        .values({
            orgId,
            uuid: uuidv4(),
            ...data,
        })
        .$returningId();

    return getProduct(product.id.toString(), orgId);
};

/**
 * Get product by ID
 * @param id - Product ID
 * @param orgId - Organization ID
 * @returns Product with variants, category, and unit
 */
export const getProduct = async (id: string, orgId: number) => {
    const product = await db.query.products.findFirst({
        where: and(eq(products.id, parseInt(id)), eq(products.orgId, orgId)),
        with: {
            variants: true,
            category: true,
            unit: true,
        },
    });

    if (!product) {
        throw new NotFoundError('Product not found');
    }

    return product;
};

/**
 * List all products for an organization
 * @param orgId - Organization ID
 * @returns Array of products with variants
 */
export const listProducts = async (orgId: number) => {
    return db.query.products.findMany({
        where: eq(products.orgId, orgId),
        with: {
            variants: true,
            category: true,
            unit: true,
        },
        orderBy: (products, { desc }) => [desc(products.createdAt)],
    });
};

/**
 * Update product
 * @param id - Product ID
 * @param orgId - Organization ID
 * @param data - Product update data
 * @returns Updated product
 */
export const updateProduct = async (id: string, orgId: number, data: UpdateProductInput) => {
    const [updated] = await db
        .update(products)
        .set(data)
        .where(and(eq(products.id, parseInt(id)), eq(products.orgId, orgId)))
        .$returningId();

    if (!updated) {
        throw new NotFoundError('Product not found');
    }

    return getProduct(id, orgId);
};

/**
 * Delete product (soft delete)
 * @param id - Product ID
 * @param orgId - Organization ID
 * @returns Success status
 */
export const deleteProduct = async (id: string, orgId: number) => {
    const [deleted] = await db
        .update(products)
        .set({ deletedAt: new Date() })
        .where(and(eq(products.id, parseInt(id)), eq(products.orgId, orgId)))
        .$returningId();

    if (!deleted) {
        throw new NotFoundError('Product not found');
    }

    return true;
};

/**
 * List all product categories for an organization
 * @param orgId - Organization ID
 * @returns Array of categories
 */
export const listCategories = async (orgId: number) => {
    return db.query.productCategories.findMany({
        where: eq(productCategories.orgId, orgId),
        orderBy: (productCategories, { asc }) => [asc(productCategories.name)],
    });
};

/**
 * List all units for an organization
 * @param orgId - Organization ID
 * @returns Array of units
 */
export const listUnits = async (orgId: number) => {
    return db.query.units.findMany({
        where: eq(units.orgId, orgId),
        orderBy: (units, { asc }) => [asc(units.name)],
    });
};
