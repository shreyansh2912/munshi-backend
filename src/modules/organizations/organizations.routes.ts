/**
 * Organizations Module - Multi-tenancy management
 */

import { FastifyInstance } from 'fastify';
import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '@db/mysql/client.js';
import { organizations, memberships } from '@db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { successJson } from '@helpers/response.js';
import { authenticate } from '@middlewares/auth.js';

// Request body types
interface CreateOrganizationBody {
    name: string;
    legalName?: string;
    gstin?: string;
    pan?: string;
    tan?: string;
    cin?: string;
    businessType?: 'proprietorship' | 'partnership' | 'llp' | 'private_limited' | 'public_limited' | 'other';
    industry?: string;
    currency?: string;
    timezone?: string;
    fiscalYearStartMonth?: number;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    logoUrl?: string;
    website?: string;
    email?: string;
    phone?: string;
}

const listOrganizationsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) throw new Error('User not authenticated');

    // Get user's organizations through memberships
    const userOrgs = await db.query.memberships.findMany({
        where: eq(memberships.userId, request.user.id),
        with: {
            organization: true,
            role: true,
        },
    });

    return successJson(reply, {
        statusCode: 200,
        message: 'Organizations retrieved',
        data: userOrgs.map(m => ({ ...m.organization, role: m.role }))
    });
};

const getCurrentOrganizationHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) throw new Error('User not authenticated');

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, request.user.orgId),
    });

    if (!org) return reply.status(404).send({ error: 'Organization not found' });
    return successJson(reply, { statusCode: 200, message: 'Organization retrieved', data: org });
};

const createOrganizationHandler = async (request: FastifyRequest<{ Body: CreateOrganizationBody }>, reply: FastifyReply) => {
    if (!request.user) throw new Error('User not authenticated');

    const [org] = await db.insert(organizations).values({
        uuid: uuidv4(),
        createdBy: request.user.id,
        ...request.body,
    }).$returningId();

    if (!org) {
        return reply.status(500).send({ error: 'Failed to create organization' });
    }

    // Create owner membership
    await db.insert(memberships).values({
        userId: request.user.id,
        orgId: org.id,
        roleId: 1, // Assuming 1 is owner role
    });

    return successJson(reply, { statusCode: 201, message: 'Organization created', data: org });
};

const switchOrganizationHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (!request.user) throw new Error('User not authenticated');

    // Verify user has access to this org
    const membership = await db.query.memberships.findFirst({
        where: and(
            eq(memberships.userId, request.user.id),
            eq(memberships.orgId, parseInt(request.params.id))
        ),
    });

    if (!membership) return reply.status(403).send({ error: 'Access denied' });

    // In a real app, you'd update the session/token here
    return successJson(reply, { statusCode: 200, message: 'Organization switched', data: { orgId: request.params.id } });
};

export const organizationsRoutes = async (fastify: FastifyInstance): Promise<void> => {
    fastify.addHook('preHandler', authenticate);

    fastify.get('/', listOrganizationsHandler);
    fastify.get('/current', getCurrentOrganizationHandler);
    fastify.post('/', createOrganizationHandler);
    fastify.post('/:id/switch', switchOrganizationHandler);
};
