/**
 * Fastify Type Augmentation
 * Extends Fastify types with custom properties
 */

import type { User } from '../modules/user/user.repository.js';

declare module 'fastify' {
    interface FastifyRequest {
        user?: User;
        // transaction?: Prisma.TransactionClient; // TODO: Add Drizzle transaction type if needed
        deviceFingerprint: string;
    }
}
