/**
 * Dashboard Module - Validation
 * Zod schemas for dashboard query parameters
 * 
 * @module modules/dashboard/dashboard.validation
 */

import { z } from 'zod';

/**
 * Supported time periods for chart data
 */
export const periodSchema = z.enum(['7d', '30d', '90d']).default('7d');

/**
 * Dashboard metrics query parameters
 */
export const getDashboardMetricsSchema = z.object({
    organizationId: z.number().optional(), // Optional for multi-org support
});

/**
 * Recent activity query parameters
 */
export const getRecentActivitySchema = z.object({
    limit: z.number().min(1).max(50).default(10),
    organizationId: z.number().optional(),
});

/**
 * Chart data query parameters
 */
export const getChartDataSchema = z.object({
    period: periodSchema,
    organizationId: z.number().optional(),
});

// Export types
export type GetDashboardMetricsInput = z.infer<typeof getDashboardMetricsSchema>;
export type GetRecentActivityInput = z.infer<typeof getRecentActivitySchema>;
export type GetChartDataInput = z.infer<typeof getChartDataSchema>;
