/**
 * Organizations Module - Service
 * Business logic for organization and multi-tenancy operations
 */

import { db } from '@db/mysql/client.js';
import { organizations, memberships } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { CreateOrganizationInput, UpdateOrganizationInput } from './organizations.validation.js';
import { NotFoundError, ForbiddenError } from '@helpers/errors.js';

/**
 * Create a new organization
 * @param userId - User ID creating the organization
 * @param data - Organization creation data
 * @returns Created organization
 */
export const createOrganization = async (userId: string, data: CreateOrganizationInput) => {
    const [org] = await db
        .insert(organizations)
        .values({
            uuid: uuidv4(),
            createdBy: userId,
            ...data,
        })
        .$returningId();

    // Create owner membership
    await db.insert(memberships).values({
        userId: userId,
        orgId: org.id,
        roleId: 1, // Assuming 1 is owner role
    });

    return getOrganization(org.id);
};

/**
 * Get organization by ID
 * @param id - Organization ID
 * @returns Organization details
 */
export const getOrganization = async (id: number) => {
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, id),
    });

    if (!org) {
        throw new NotFoundError('Organization not found');
    }

    return org;
};

/**
 * Get current user's organization
 * @param orgId - Organization ID from user context
 * @returns Current organization
 */
export const getCurrentOrganization = async (orgId: number) => {
    return getOrganization(orgId);
};

/**
 * List user's organizations
 * @param userId - User ID
 * @returns Array of organizations with roles
 */
export const listUserOrganizations = async (userId: string) => {
    const userOrgs = await db.query.memberships.findMany({
        where: eq(memberships.userId, userId),
        with: {
            organization: true,
            role: true,
        },
    });

    return userOrgs.map(m => ({
        ...m.organization,
        role: m.role,
    }));
};

/**
 * Update organization
 * @param id - Organization ID
 * @param userId - User ID making the update
 * @param data - Organization update data
 * @returns Updated organization
 */
export const updateOrganization = async (id: number, userId: string, data: UpdateOrganizationInput) => {
    // Verify user has permission
    const membership = await db.query.memberships.findFirst({
        where: and(
            eq(memberships.userId, userId),
            eq(memberships.orgId, id)
        ),
    });

    if (!membership) {
        throw new ForbiddenError('Access denied to this organization');
    }

    await db
        .update(organizations)
        .set(data)
        .where(eq(organizations.id, id));

    return getOrganization(id);
};

/**
 * Verify user has access to organization
 * @param userId - User ID
 * @param orgId - Organization ID
 * @returns True if user has access
 */
export const verifyOrganizationAccess = async (userId: string, orgId: number): Promise<boolean> => {
    const membership = await db.query.memberships.findFirst({
        where: and(
            eq(memberships.userId, userId),
            eq(memberships.orgId, orgId)
        ),
    });

    return !!membership;
};

/**
 * Switch user's organization context
 * @param userId - User ID
 * @param orgId - Organization ID to switch to
 * @returns Organization details if access is granted
 */
export const switchOrganization = async (userId: string, orgId: number) => {
    const hasAccess = await verifyOrganizationAccess(userId, orgId);

    if (!hasAccess) {
        throw new ForbiddenError('Access denied to this organization');
    }

    return getOrganization(orgId);
};
