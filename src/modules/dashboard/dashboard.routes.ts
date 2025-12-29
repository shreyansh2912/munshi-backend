/**
 * Dashboard Module - Routes
 * Route definitions for dashboard endpoints
 * 
 * @module modules/dashboard/dashboard.routes
 */

import type { FastifyInstance } from 'fastify';
import * as dashboardController from './dashboard.controller.js';
import * as dashboardValidation from './dashboard.validation.js';
import { authenticate } from '@middlewares/auth.js';
import { validateRequest } from '@middlewares/validation.js';

export const dashboardRoutes = async (app: FastifyInstance) => {
    /**
     * GET /metrics
     * Get dashboard metrics with trends
     */
    app.get(
        '/metrics',
        {
            onRequest: [authenticate],
        },
        dashboardController.getDashboardMetrics
    );

    /**
     * GET /recent-activity
     * Get recent activity/transactions
     */
    app.get(
        '/recent-activity',
        {
            onRequest: [authenticate],
            schema: {
                querystring: dashboardValidation.getRecentActivitySchema,
            },
        },
        dashboardController.getRecentActivity
    );

    /**
     * GET /chart-data
     * Get chart data for specified period
     */
    app.get(
        '/chart-data',
        {
            onRequest: [authenticate],
            schema: {
                querystring: dashboardValidation.getChartDataSchema,
            },
        },
        dashboardController.getChartData
    );
};
