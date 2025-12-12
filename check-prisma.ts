
import { PrismaClient } from '@prisma/client';

try {
    const client = new PrismaClient();
    console.log('Prisma Client initialized');
    // Check if the model property exists on the client instance
    if ('deviceFingerprint' in client) {
        console.log('deviceFingerprint model found on client');
    } else {
        console.log('deviceFingerprint model NOT found on client');
    }
} catch (e) {
    console.error(e);
}
