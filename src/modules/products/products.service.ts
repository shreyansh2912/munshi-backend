/**
 * Products Module - Service
 * 
 * Business logic for product operations with:
 * - Duplicate SKU validation
 * - Pagination support
 * - Stock level tracking
 * - Proper error handling
 * 
 * @module modules/products/products.service
 */

import { db } from '@db/mysql/client.js';
import { products, productCategories, units } from '@db/schema';
import { eq, and, or, isNull, desc, asc, like, sql, lte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { CreateProductInput, UpdateProductInput } from './products.validation.js';
import { NotFoundError, AlreadyExistsError, BusinessLogicError } from '@utils/errors.js';
import {
    parsePaginationParams,
    buildPaginatedResponse,
    type PaginationParams,
    type PaginatedResponse,
} from '@utils/pagination.js';

// ============================================================================
// TYPES
// ============================================================================

interface ListProductsParams extends PaginationParams {
    search?: string;
    categoryId?: number;
    lowStock?: boolean;
    isActive?: boolean;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if SKU already exists
 * 
 * @throws {AlreadyExistsError} If SKU is already in use
 */
async function validateSKU(
    orgId: number,
    sku: string,
    excludeId?: number
): Promise<void> {
    const existing = await db.query.products.findFirst({
        where: and(
            eq(products.orgId, orgId),
            eq(products.sku, sku),
            isNull(products.deletedAt),
            excludeId ? sql`${products.id} != ${excludeId}` : undefined
        ),
    });

    if (existing) {
        throw new AlreadyExistsError('Product', 'SKU', sku);
    }
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new product
 * 
 * Validates SKU uniqueness before creating.
 * 
 * @param orgId - Organization ID
 * @param data - Product creation data
 * @returns Created product with relations
 * @throws {AlreadyExistsError} If SKU already exists
 */
export const createProduct = async (orgId: number, data: CreateProductInput) => {
    // Validate unique SKU
    if (data.sku) {
        await validateSKU(orgId, data.sku);
    }

    const [product] = await db
        .insert(products)
        .values({
            orgId,
            uuid: uuidv4(),
            ...data,
        })
        .$returningId();

    if (!product) {
        throw new Error('Failed to create product');
    }

    return getProduct(product.id.toString(), orgId);
};

// ============================================================================
// READ
// ============================================================================

/**
 * Get product by ID
 * 
 * @param id - Product ID
 * @param orgId - Organization ID
 * @returns Product with variants, category, and unit
 * @throws {NotFoundError} If product not found
 */
export const getProduct = async (id: string, orgId: number) => {
    const product = await db.query.products.findFirst({
        where: and(
            eq(products.id, parseInt(id)),
            eq(products.orgId, orgId),
            isNull(products.deletedAt)
        ),
        with: {
            variants: true,
            category: true,
            unit: true,
        },
    });

    if (!product) {
        throw new NotFoundError('Product', id);
    }

    return product;
};

/**
 * List products with pagination and filtering
 * 
 * @param orgId - Organization ID
 * @param params - Query parameters
 * @returns Paginated product list
 */
export const listProducts = async (
    orgId: number,
    params: ListProductsParams = {}
): Promise<PaginatedResponse<typeof products.$inferSelect>> => {
    const options = parsePaginationParams(params);

    // Build where conditions
    const conditions = [
        eq(products.orgId, orgId),
        isNull(products.deletedAt),
    ];

    // Add search filter (name, SKU, description)
    if (params.search) {
        conditions.push(
            or(
                like(products.name, `%${params.search}%`),
                like(products.sku, `%${params.search}%`),
                like(products.description, `%${params.search}%`)
            )!
        );
    }

    // Add category filter
    if (params.categoryId) {
        conditions.push(eq(products.categoryId, params.categoryId));
    }

    // TODO: Add low stock filter using stockSummary table
    // The products table doesn't have stockQuantity or minStockLevel fields
    // Stock is tracked in the stockSummary table via productVariants
    if (params.lowStock) {
        // For now, we'll skip this filter until proper implementation
        console.warn('Low stock filtering is not yet implemented');
    }

    // Add active filter
    if (params.isActive !== undefined) {
        conditions.push(eq(products.isActive, params.isActive));
    }

    // Get total count
    const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(...conditions));

    const count = result[0]?.count ?? 0;

    // Get paginated data
    const data = await db
        .select()
        .from(products)
        .where(and(...conditions))
        .orderBy(options.order === 'asc' ? asc(products.createdAt) : desc(products.createdAt))
        .limit(options.limit)
        .offset(options.offset);

    return buildPaginatedResponse(data, count, options);
};

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update product
 * 
 * Validates SKU uniqueness if changed.
 * 
 * @param id - Product ID
 * @param orgId - Organization ID
 * @param data - Product update data
 * @returns Updated product
 * @throws {NotFoundError} If product not found
 * @throws {AlreadyExistsError} If SKU already exists
 */
export const updateProduct = async (
    id: string,
    orgId: number,
    data: UpdateProductInput
) => {
    const productId = parseInt(id);

    // Verify product exists
    await getProduct(id, orgId);

    // Validate unique SKU if being updated
    if (data.sku) {
        await validateSKU(orgId, data.sku, productId);
    }

    await db
        .update(products)
        .set(data)
        .where(and(
            eq(products.id, productId),
            eq(products.orgId, orgId),
            isNull(products.deletedAt)
        ));

    return getProduct(id, orgId);
};

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete product (soft delete)
 * 
 * @param id - Product ID
 * @param orgId - Organization ID
 * @returns Success status
 * @throws {NotFoundError} If product not found
 */
export const deleteProduct = async (id: string, orgId: number) => {
    // Verify product exists before deleting
    await getProduct(id, orgId);

    await db
        .update(products)
        .set({ deletedAt: new Date() })
        .where(and(
            eq(products.id, parseInt(id)),
            eq(products.orgId, orgId),
            isNull(products.deletedAt)
        ));

    return true;
};

// ============================================================================
// CATEGORIES & UNITS
// ============================================================================

/**
 * List all product categories for an organization
 * 
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
 * 
 * @param orgId - Organization ID
 * @returns Array of units
 */
export const listUnits = async (orgId: number) => {
    return db.query.units.findMany({
        where: eq(units.orgId, orgId),
        orderBy: (units, { asc }) => [asc(units.name)],
    });
};

// ============================================================================
// STOCK MANAGEMENT
// ============================================================================

/**
 * Get low stock products
 * 
 * @param orgId - Organization ID
 * @returns Products with stock below minimum level
 */
export async function getLowStockProducts(orgId: number) {
    // TODO: Implement proper low stock checking using stockSummary table
    // The products table doesn't have stockQuantity or minStockLevel fields
    // Need to join with stockSummary and check against a configurable threshold

    console.warn('getLowStockProducts is not yet properly implemented');
    return [];
}

/**
 * Get out of stock products
 * 
 * @param orgId - Organization ID
 * @returns Products with zero stock
 */
export async function getOutOfStockProducts(orgId: number) {
    // TODO: Implement proper out-of-stock checking using stockSummary table
    // The products table doesn't have stockQuantity field
    // Need to join with stockSummary and check for zero available quantity

    console.warn('getOutOfStockProducts is not yet properly implemented');
    return [];
}
