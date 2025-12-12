
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('Checking Prisma Client exports...');

// Check if models are exposed on the client instance (usually via delegates)
// Note: Types are not available at runtime in the same way, but we can check if the property exists on the client instance
// However, the types like 'RefreshToken' are exported from the module itself, not the instance.
// But we can't check named exports easily with a script unless we import them.

// Let's try to import them dynamically or check the module object if possible.
// Since we are using ESM (type: module in package.json), we can try to import * as PrismaModule

import * as PrismaModule from '@prisma/client';

console.log('Available exports in @prisma/client:', Object.keys(PrismaModule));

const hasRefreshToken = 'RefreshToken' in PrismaModule; // This might be a type, so it might not exist at runtime if it's ONLY a type.
// Wait, generated types are usually just types. But the classes/models might be exported if they are classes.
// In Prisma, the models are usually just interfaces/types.
// However, the `Prisma` namespace is exported.

console.log('Prisma namespace available:', 'Prisma' in PrismaModule);

// We can check if the delegate exists on the instance
const hasRefreshTokenDelegate = 'refreshToken' in prisma;
const hasDeviceFingerprintDelegate = 'deviceFingerprint' in prisma;

console.log('prisma.refreshToken delegate exists:', hasRefreshTokenDelegate);
console.log('prisma.deviceFingerprint delegate exists:', hasDeviceFingerprintDelegate);

if (hasRefreshTokenDelegate && hasDeviceFingerprintDelegate) {
    console.log('SUCCESS: Delegates exist on the client instance.');
} else {
    console.log('FAILURE: Delegates missing.');
}
