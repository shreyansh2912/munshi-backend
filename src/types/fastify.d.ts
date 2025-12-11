/**
 * Fastify Type Augmentation
 * Extends Fastify types with custom properties
 */

import { User } from '@prisma/client';
import { Prisma } from '@prisma/client';

declare module 'fastify' {
    interface FastifyRequest {
        user?: User;
        transaction?: Prisma.TransactionClient;
        deviceFingerprint?: string;
    }
}
