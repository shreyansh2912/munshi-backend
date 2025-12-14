/**
 * Fastify Type Augmentation
 * Extends Fastify types with custom properties
 */

import type { User as BaseUser } from '../modules/user/user.repository.js';

// Extend User type to include orgId as an alias for currentOrgId
export type User = BaseUser & {
    orgId: number | null;
};

declare module 'fastify' {
    interface FastifyRequest {
        user?: User;
        // transaction?: Prisma.TransactionClient; // TODO: Add Drizzle transaction type if needed
        deviceFingerprint: string;
    }
}
