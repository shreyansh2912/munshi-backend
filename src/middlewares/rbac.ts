/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks if authenticated user has required role
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@prisma/client';

import { AuthorizationError } from '@helpers/errors.js';
import { logger } from '@config/logger.js';

/**
 * Create RBAC middleware for specific roles
 *
 * @param allowedRoles - Array of roles that are allowed access
 * @returns Middleware function
 *
 * @example
 * ```ts
 * fastify.get('/admin', {
 *   preHandler: [authenticate, requireRole([UserRole.ADMIN])]
 * }, handler);
 * ```
 */
export const requireRole = (allowedRoles: UserRole[]) => {
    return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
        // User must be authenticated first
        if (!request.user) {
            throw new AuthorizationError('Authentication required');
        }

        // Check if user has required role
        if (!allowedRoles.includes(request.user.role)) {
            logger.warn(
                {
                    userId: request.user.id,
                    userRole: request.user.role,
                    requiredRoles: allowedRoles,
                },
                'Insufficient permissions'
            );

            throw new AuthorizationError(
                `Access denied. Required roles: ${allowedRoles.join(', ')}`
            );
        }

        logger.debug(
            {
                userId: request.user.id,
                role: request.user.role,
            },
            'Role check passed'
        );
    };
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole([UserRole.ADMIN]);

/**
 * Middleware to require user or admin role
 */
export const requireUser = requireRole([UserRole.USER, UserRole.ADMIN]);

/**
 * Middleware to require enterprise member or admin role
 */
export const requireEnterprise = requireRole([UserRole.ENTERPRISE_MEMBER, UserRole.ADMIN]);
