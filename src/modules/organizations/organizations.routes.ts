/**
 * Organizations Module - Routes
 * API endpoints for organization and multi-tenancy management
 */

import { FastifyInstance } from 'fastify';
import { authenticate } from '@middlewares/auth.js';
import {
    createOrganizationHandler,
    getCurrentOrganizationHandler,
    listOrganizationsHandler,
    updateOrganizationHandler,
    switchOrganizationHandler,
} from './organizations.controller.js';

/**
 * Register organization routes
 * @param fastify - Fastify instance
 */
export const organizationsRoutes = async (fastify: FastifyInstance): Promise<void> => {
    // Apply authentication to all routes
    fastify.addHook('preHandler', authenticate);

    // Organization routes
    fastify.get('/', listOrganizationsHandler);
    fastify.post('/', createOrganizationHandler);
    fastify.get('/current', getCurrentOrganizationHandler);
    fastify.patch('/:id', updateOrganizationHandler);
    fastify.post('/:id/switch', switchOrganizationHandler);
};
