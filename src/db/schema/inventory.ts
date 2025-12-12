/**
 * Inventory Tables Schema - Products, Stock, Tax Rates
 */

import {
    mysqlTable,
    bigint,
    char,
    varchar,
    boolean,
    datetime,
    date,
    mysqlEnum,
    text,
    json,
    int,
    smallint,
    decimal,
    index,
    uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { organizations, users } from './core';

/**
 * Tax Rates table
 */
export const taxRates = mysqlTable(
    'tax_rates',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        name: varchar('name', { length: 100 }).notNull(),
        rate: decimal('rate', { precision: 5, scale: 2 }).notNull(),
        taxType: mysqlEnum('tax_type', ['CGST', 'SGST', 'IGST', 'CESS', 'TDS', 'TCS', 'OTHER']).notNull(),
        hsnCode: varchar('hsn_code', { length: 50 }),
        sacCode: varchar('sac_code', { length: 50 }),
        isActive: boolean('is_active').default(true),
        effectiveFrom: date('effective_from', { mode: 'date' }),
        effectiveTo: date('effective_to', { mode: 'date' }),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
    },
    (table) => ({
        orgActiveIdx: index('idx_org_active').on(table.orgId, table.isActive),
        orgTypeIdx: index('idx_org_type').on(table.orgId, table.taxType),
    })
);

/**
 * Product Categories table
 */
export const productCategories = mysqlTable(
    'product_categories',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        name: varchar('name', { length: 255 }).notNull(),
        parentId: bigint('parent_id', { mode: 'number' }),
        description: text('description'),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
    },
    (table) => ({
        orgParentIdx: index('idx_org_parent').on(table.orgId, table.parentId),
    })
);

/**
 * Products table
 */
export const products = mysqlTable(
    'products',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        uuid: char('uuid', { length: 36 }).notNull().unique(),
        sku: varchar('sku', { length: 100 }).notNull(),
        name: varchar('name', { length: 255 }).notNull(),
        description: text('description'),
        categoryId: bigint('category_id', { mode: 'number' }),
        hsnCode: varchar('hsn_code', { length: 50 }),
        sacCode: varchar('sac_code', { length: 50 }),
        productType: mysqlEnum('product_type', ['goods', 'service']).default('goods'),
        unitId: bigint('unit_id', { mode: 'number' }),
        hasVariants: boolean('has_variants').default(false),
        trackInventory: boolean('track_inventory').default(true),
        isActive: boolean('is_active').default(true),
        meta: json('meta'),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
        deletedAt: datetime('deleted_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        uniqueOrgSku: uniqueIndex('unique_org_sku').on(table.orgId, table.sku),
        orgNameIdx: index('idx_org_name').on(table.orgId, table.name),
        orgCategoryIdx: index('idx_org_category').on(table.orgId, table.categoryId),
        uuidIdx: index('idx_uuid').on(table.uuid),
    })
);

/**
 * Product Variants table
 */
export const productVariants = mysqlTable(
    'product_variants',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        productId: bigint('product_id', { mode: 'number' }).notNull(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        uuid: char('uuid', { length: 36 }).notNull().unique(),
        variantSku: varchar('variant_sku', { length: 100 }).notNull(),
        variantName: varchar('variant_name', { length: 255 }),
        attributes: json('attributes').$type<Record<string, string>>(),
        costPrice: bigint('cost_price', { mode: 'number' }).default(0),
        sellingPrice: bigint('selling_price', { mode: 'number' }).default(0),
        mrp: bigint('mrp', { mode: 'number' }).default(0),
        barcode: varchar('barcode', { length: 100 }),
        isActive: boolean('is_active').default(true),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
        deletedAt: datetime('deleted_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        uniqueOrgVariantSku: uniqueIndex('unique_org_variant_sku').on(table.orgId, table.variantSku),
        productIdx: index('idx_product').on(table.productId),
        orgBarcodeIdx: index('idx_org_barcode').on(table.orgId, table.barcode),
        uuidIdx: index('idx_uuid').on(table.uuid),
    })
);

/**
 * Units table
 */
export const units = mysqlTable(
    'units',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        name: varchar('name', { length: 50 }).notNull(),
        shortCode: varchar('short_code', { length: 10 }).notNull(),
        unitType: mysqlEnum('unit_type', ['quantity', 'weight', 'volume', 'length', 'area', 'time', 'other']).default('quantity'),
        baseUnitId: bigint('base_unit_id', { mode: 'number' }),
        conversionFactor: decimal('conversion_factor', { precision: 18, scale: 8 }).default('1.00000000'),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
    },
    (table) => ({
        uniqueOrgCode: uniqueIndex('unique_org_code').on(table.orgId, table.shortCode),
        orgTypeIdx: index('idx_org_type').on(table.orgId, table.unitType),
    })
);

/**
 * Stock Locations table
 */
export const stockLocations = mysqlTable(
    'stock_locations',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        uuid: char('uuid', { length: 36 }).notNull().unique(),
        name: varchar('name', { length: 255 }).notNull(),
        locationType: mysqlEnum('location_type', ['warehouse', 'store', 'transit', 'virtual']).default('warehouse'),
        addressLine1: varchar('address_line1', { length: 255 }),
        addressLine2: varchar('address_line2', { length: 255 }),
        city: varchar('city', { length: 100 }),
        state: varchar('state', { length: 100 }),
        pincode: varchar('pincode', { length: 10 }),
        isActive: boolean('is_active').default(true),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
        updatedAt: datetime('updated_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
    },
    (table) => ({
        orgActiveIdx: index('idx_org_active').on(table.orgId, table.isActive),
        uuidIdx: index('idx_uuid').on(table.uuid),
    })
);

/**
 * Stock Batches table
 */
export const stockBatches = mysqlTable(
    'stock_batches',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        uuid: char('uuid', { length: 36 }).notNull().unique(),
        productVariantId: bigint('product_variant_id', { mode: 'number' }).notNull(),
        batchNumber: varchar('batch_number', { length: 100 }).notNull(),
        manufacturingDate: date('manufacturing_date', { mode: 'date' }),
        expiryDate: date('expiry_date', { mode: 'date' }),
        purchasePrice: bigint('purchase_price', { mode: 'number' }),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
    },
    (table) => ({
        uniqueOrgBatch: uniqueIndex('unique_org_batch').on(table.orgId, table.productVariantId, table.batchNumber),
        orgVariantIdx: index('idx_org_variant').on(table.orgId, table.productVariantId),
        expiryIdx: index('idx_expiry').on(table.expiryDate),
        uuidIdx: index('idx_uuid').on(table.uuid),
    })
);

/**
 * Stock Movements table
 */
export const stockMovements = mysqlTable(
    'stock_movements',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        uuid: char('uuid', { length: 36 }).notNull().unique(),
        movementDate: datetime('movement_date', { mode: 'date', fsp: 6 }).notNull(),
        movementType: mysqlEnum('movement_type', ['purchase', 'sale', 'adjustment', 'transfer', 'return', 'opening', 'damage', 'production']).notNull(),
        productVariantId: bigint('product_variant_id', { mode: 'number' }).notNull(),
        batchId: bigint('batch_id', { mode: 'number' }),
        quantity: bigint('quantity', { mode: 'number' }).notNull(),
        fromLocationId: bigint('from_location_id', { mode: 'number' }),
        toLocationId: bigint('to_location_id', { mode: 'number' }),
        referenceType: varchar('reference_type', { length: 50 }),
        referenceId: char('reference_id', { length: 36 }),
        referenceNumber: varchar('reference_number', { length: 100 }),
        notes: text('notes'),
        createdBy: char('created_by', { length: 36 }).notNull(),
        createdAt: datetime('created_at', { mode: 'date', fsp: 6 }).notNull().$defaultFn(() => new Date()),
    },
    (table) => ({
        orgDateIdx: index('idx_org_date').on(table.orgId, table.movementDate),
        orgVariantIdx: index('idx_org_variant').on(table.orgId, table.productVariantId),
        orgTypeIdx: index('idx_org_type').on(table.orgId, table.movementType),
        referenceIdx: index('idx_reference').on(table.orgId, table.referenceType, table.referenceId),
        uuidIdx: index('idx_uuid').on(table.uuid),
    })
);

/**
 * Stock Summary table
 */
export const stockSummary = mysqlTable(
    'stock_summary',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
        orgId: bigint('org_id', { mode: 'number' }).notNull(),
        productVariantId: bigint('product_variant_id', { mode: 'number' }).notNull(),
        locationId: bigint('location_id', { mode: 'number' }).notNull(),
        batchId: bigint('batch_id', { mode: 'number' }),
        quantity: bigint('quantity', { mode: 'number' }).notNull().default(0),
        reservedQuantity: bigint('reserved_quantity', { mode: 'number' }).notNull().default(0),
        availableQuantity: bigint('available_quantity', { mode: 'number' }).notNull().default(0),
        lastMovementId: bigint('last_movement_id', { mode: 'number' }),
        lastUpdatedAt: datetime('last_updated_at', { mode: 'date', fsp: 6 }),
    },
    (table) => ({
        uniqueStock: uniqueIndex('unique_stock').on(table.orgId, table.productVariantId, table.locationId, table.batchId),
        orgVariantIdx: index('idx_org_variant').on(table.orgId, table.productVariantId),
        orgLocationIdx: index('idx_org_location').on(table.orgId, table.locationId),
    })
);

/**
 * Relations
 */
export const taxRatesRelations = relations(taxRates, ({ one }) => ({
    organization: one(organizations, {
        fields: [taxRates.orgId],
        references: [organizations.id],
    }),
}));

export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [productCategories.orgId],
        references: [organizations.id],
    }),
    parent: one(productCategories, {
        fields: [productCategories.parentId],
        references: [productCategories.id],
        relationName: 'categoryHierarchy',
    }),
    children: many(productCategories, {
        relationName: 'categoryHierarchy',
    }),
    products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [products.orgId],
        references: [organizations.id],
    }),
    category: one(productCategories, {
        fields: [products.categoryId],
        references: [productCategories.id],
    }),
    unit: one(units, {
        fields: [products.unitId],
        references: [units.id],
    }),
    variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [productVariants.orgId],
        references: [organizations.id],
    }),
    product: one(products, {
        fields: [productVariants.productId],
        references: [products.id],
    }),
    batches: many(stockBatches),
    movements: many(stockMovements),
    stockSummaries: many(stockSummary),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [units.orgId],
        references: [organizations.id],
    }),
    baseUnit: one(units, {
        fields: [units.baseUnitId],
        references: [units.id],
        relationName: 'unitConversion',
    }),
    derivedUnits: many(units, {
        relationName: 'unitConversion',
    }),
}));

export const stockLocationsRelations = relations(stockLocations, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [stockLocations.orgId],
        references: [organizations.id],
    }),
    stockSummaries: many(stockSummary),
}));

export const stockBatchesRelations = relations(stockBatches, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [stockBatches.orgId],
        references: [organizations.id],
    }),
    productVariant: one(productVariants, {
        fields: [stockBatches.productVariantId],
        references: [productVariants.id],
    }),
    movements: many(stockMovements),
    stockSummaries: many(stockSummary),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
    organization: one(organizations, {
        fields: [stockMovements.orgId],
        references: [organizations.id],
    }),
    productVariant: one(productVariants, {
        fields: [stockMovements.productVariantId],
        references: [productVariants.id],
    }),
    batch: one(stockBatches, {
        fields: [stockMovements.batchId],
        references: [stockBatches.id],
    }),
    fromLocation: one(stockLocations, {
        fields: [stockMovements.fromLocationId],
        references: [stockLocations.id],
    }),
    toLocation: one(stockLocations, {
        fields: [stockMovements.toLocationId],
        references: [stockLocations.id],
    }),
    creator: one(users, {
        fields: [stockMovements.createdBy],
        references: [users.id],
    }),
}));

export const stockSummaryRelations = relations(stockSummary, ({ one }) => ({
    organization: one(organizations, {
        fields: [stockSummary.orgId],
        references: [organizations.id],
    }),
    productVariant: one(productVariants, {
        fields: [stockSummary.productVariantId],
        references: [productVariants.id],
    }),
    location: one(stockLocations, {
        fields: [stockSummary.locationId],
        references: [stockLocations.id],
    }),
    batch: one(stockBatches, {
        fields: [stockSummary.batchId],
        references: [stockBatches.id],
    }),
}));
