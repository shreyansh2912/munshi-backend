/**
 * Dashboard Module - Controller
 * HTTP handlers for dashboard endpoints
 * 
 * @module modules/dashboard/dashboard.controller
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import * as dashboardService from './dashboard.service.js';
import type { GetRecentActivityInput, GetChartDataInput } from './dashboard.validation.js';
import { successResponse } from '@helpers/response.js';

// ============================================================================
// METRICS
// ============================================================================

/**
 * GET /api/v1/dashboard/metrics
 * Get dashboard metrics with trends
 */
export const getDashboardMetrics = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const orgId = request.user.orgId;
    const metrics = await dashboardService.getMetrics(orgId);

    return reply.send(successResponse(metrics, 'Dashboard metrics fetched successfully'));
};

// ============================================================================
// RECENT ACTIVITY
// ============================================================================

/**
 * GET /api/v1/dashboard/recent-activity
 * Get recent activity/transactions
 */
export const getRecentActivity = async (
    request: FastifyRequest<{
        Querystring: GetRecentActivityInput;
    }>,
    reply: FastifyReply
) => {
    const orgId = request.user.orgId;
    const params = request.query;

    const activity = await dashboardService.getRecentActivity(orgId, params);

    return reply.send(successResponse(activity, 'Recent activity fetched successfully'));
};

// ============================================================================
// CHART DATA
// ============================================================================

/**
 * GET /api/v1/dashboard/chart-data
 * Get chart data for specified period
 */
export const getChartData = async (
    request: FastifyRequest<{
        Querystring: GetChartDataInput;
    }>,
    reply: FastifyReply
) => {
    const orgId = request.user.orgId;
    const params = request.query;

    const chartData = await dashboardService.getChartData(orgId, params);

    return reply.send(successResponse(chartData, 'Chart data fetched successfully'));
};
