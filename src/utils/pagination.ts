/**
 * Pagination Utilities
 * 
 * Helper functions for implementing pagination across API endpoints.
 * Provides consistent pagination behavior and response formatting.
 * 
 * @module utils/pagination
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Pagination query parameters from request
 */
export interface PaginationParams {
    /** Page number (1-indexed) */
    page?: number;
    /** Items per page */
    limit?: number;
    /** Sort field */
    sortBy?: string;
    /** Sort direction */
    order?: 'asc' | 'desc';
}

/**
 * Parsed and validated pagination options
 */
export interface PaginationOptions {
    /** Page number (1-indexed) */
    page: number;
    /** Items per page */
    limit: number;
    /** Offset for database query */
    offset: number;
    /** Sort field (optional) */
    sortBy?: string;
    /** Sort order */
    order: 'asc' | 'desc';
}

/**
 * Pagination metadata for response
 */
export interface PaginationMeta {
    /** Current page number */
    page: number;
    /** Items per page */
    limit: number;
    /** Total number of items */
    total: number;
    /** Total number of pages */
    totalPages: number;
    /** Has previous page */
    hasPrevPage: boolean;
    /** Has next page */
    hasNextPage: boolean;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
    /** Array of items */
    data: T[];
    /** Pagination metadata */
    pagination: PaginationMeta;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default page number */
export const DEFAULT_PAGE = 1;

/** Default items per page */
export const DEFAULT_LIMIT = 20;

/** Minimum items per page */
export const MIN_LIMIT = 1;

/** Maximum items per page */
export const MAX_LIMIT = 100;

/** Default sort order */
export const DEFAULT_ORDER = 'desc';

// ============================================================================
// PAGINATION PARSING
// ============================================================================

/**
 * Parse and validate pagination parameters from request
 * 
 * Ensures page and limit are within valid ranges and calculates offset.
 * 
 * @param params - Raw pagination parameters from query string
 * @returns Validated pagination options
 * 
 * @example
 * ```ts
 * const options = parsePaginationParams({ page: 2, limit: 10 });
 * // { page: 2, limit: 10, offset: 10, order: 'desc' }
 * ```
 */
export function parsePaginationParams(params: PaginationParams = {}): PaginationOptions {
    // Parse and validate page number
    let page = parseInt(String(params.page || DEFAULT_PAGE), 10);
    if (isNaN(page) || page < 1) {
        page = DEFAULT_PAGE;
    }

    // Parse and validate limit
    let limit = parseInt(String(params.limit || DEFAULT_LIMIT), 10);
    if (isNaN(limit) || limit < MIN_LIMIT) {
        limit = DEFAULT_LIMIT;
    }
    if (limit > MAX_LIMIT) {
        limit = MAX_LIMIT;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Parse sort order
    const order = params.order === 'asc' ? 'asc' : DEFAULT_ORDER;

    return {
        page,
        limit,
        offset,
        sortBy: params.sortBy,
        order,
    };
}

// ============================================================================
// RESPONSE BUILDING
// ============================================================================

/**
 * Build paginated response with metadata
 * 
 * Creates a standardized paginated response including pagination metadata
 * like total pages, current page, and navigation flags.
 * 
 * @param data - Array of items for current page
 * @param total - Total number of items across all pages
 * @param options - Pagination options used for query
 * @returns Paginated response with metadata
 * 
 * @example
 * ```ts
 * const customers = await db.query(...);
 * const total = await db.count(...);
 * const response = buildPaginatedResponse(customers, total, options);
 * ```
 */
export function buildPaginatedResponse<T>(
    data: T[],
    total: number,
    options: PaginationOptions
): PaginatedResponse<T> {
    const { page, limit } = options;

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Determine navigation availability
    const hasPrevPage = page > 1;
    const hasNextPage = page < totalPages;

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasPrevPage,
            hasNextPage,
        },
    };
}

// ============================================================================
// SQL HELPERS
// ============================================================================

/**
 * Build ORDER BY clause for SQL queries
 * 
 * Safely constructs SQL ORDER BY clause with field validation.
 * 
 * @param sortBy - Field to sort by
 * @param order - Sort direction
 * @param allowedFields - List of fields that can be sorted
 * @returns SQL ORDER BY clause or empty string
 * 
 * @example
 * ```ts
 * const orderBy = buildOrderByClause('name', 'asc', ['name', 'email']);
 * // Returns: "name ASC"
 * ```
 */
export function buildOrderByClause(
    sortBy: string | undefined,
    order: 'asc' | 'desc',
    allowedFields: string[]
): string {
    // Validate sort field
    if (!sortBy || !allowedFields.includes(sortBy)) {
        return '';
    }

    // Return safely constructed ORDER BY clause
    const direction = order.toUpperCase();
    return `${sortBy} ${direction}`;
}

/**
 * Validate sort field against allowed fields
 * 
 * Prevents SQL injection by validating sort field is in whitelist.
 * 
 * @param sortBy - Field to validate
 * @param allowedFields - Whitelist of allowed fields
 * @returns Validated field name or undefined
 */
export function validateSortField(
    sortBy: string | undefined,
    allowedFields: string[]
): string | undefined {
    if (!sortBy) {
        return undefined;
    }

    return allowedFields.includes(sortBy) ? sortBy : undefined;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate total pages from total items and limit
 * 
 * @param total - Total number of items
 * @param limit - Items per page
 * @returns Total number of pages
 */
export function calculateTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
}

/**
 * Check if page number is valid
 * 
 * @param page - Page number to validate
 * @param totalPages - Total number of pages
 * @returns True if page is valid
 */
export function isValidPage(page: number, totalPages: number): boolean {
    return page >= 1 && page <= totalPages;
}

/**
 * Get page range for pagination UI
 * 
 * Returns array of page numbers to display in pagination controls.
 * 
 * @param currentPage - Current page number
 * @param totalPages - Total number of pages
 * @param maxPages - Maximum page numbers to show
 * @returns Array of page numbers
 * 
 * @example
 * ```ts
 * getPageRange(5, 10, 5);
 * // Returns: [3, 4, 5, 6, 7]
 * ```
 */
export function getPageRange(
    currentPage: number,
    totalPages: number,
    maxPages: number = 5
): number[] {
    const pages: number[] = [];

    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);

    // Adjust start if we're near the end
    if (endPage - startPage + 1 < maxPages) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return pages;
}
