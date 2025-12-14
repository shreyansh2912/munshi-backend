/**
 * Organizations Module - Controller
 * Handles organization and multi-tenancy operations
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import * as organizationService from './organizations.service.js';
import { successJson } from '@helpers/response.js';
import type { CreateOrganizationInput, UpdateOrganizationInput } from './organizations.validation.js';

/**
 * Create organization
 * POST /organizations
 */
export const createOrganizationHandler = async (
    request: FastifyRequest<{ Body: CreateOrganizationInput }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const organization = await organizationService.createOrganization(
        request.user.id,
        request.body
    );

    return successJson(reply, {
        statusCode: 201,
        message: 'Organization created successfully',
        data: organization,
    });
};

/**
 * Get current organization
 * GET /organizations/current
 */
export const getCurrentOrganizationHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    if (!request.user.orgId) {
        throw new Error('User does not have an organization assigned');
    }

    const organization = await organizationService.getCurrentOrganization(request.user.orgId);

    return successJson(reply, {
        statusCode: 200,
        message: 'Organization retrieved successfully',
        data: organization,
    });
};

/**
 * List user's organizations
 * GET /organizations
 */
export const listOrganizationsHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const organizations = await organizationService.listUserOrganizations(request.user.id);

    return successJson(reply, {
        statusCode: 200,
        message: 'Organizations retrieved successfully',
        data: organizations,
    });
};

/**
 * Update organization
 * PATCH /organizations/:id
 */
export const updateOrganizationHandler = async (
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateOrganizationInput }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const organization = await organizationService.updateOrganization(
        parseInt(request.params.id),
        request.user.id,
        request.body
    );

    return successJson(reply, {
        statusCode: 200,
        message: 'Organization updated successfully',
        data: organization,
    });
};

/**
 * Switch organization context
 * POST /organizations/:id/switch
 */
export const switchOrganizationHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<FastifyReply> => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }

    const organization = await organizationService.switchOrganization(
        request.user.id,
        parseInt(request.params.id)
    );

    return successJson(reply, {
        statusCode: 200,
        message: 'Organization switched successfully',
        data: { orgId: organization.id, organization },
    });
};
