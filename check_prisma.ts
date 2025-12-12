
import { Prisma } from '@prisma/client';

console.log('Checking Prisma exports...');
try {
    const keys = Object.keys(Prisma);
    console.log('Prisma keys count:', keys.length);
    if (keys.includes('UserCreateInput')) {
        console.log('UserCreateInput found!');
    } else {
        console.log('UserCreateInput NOT found.');
        console.log('Similar keys:', keys.filter(k => k.includes('User') && k.includes('Input')));
    }
} catch (e) {
    console.error('Error accessing Prisma:', e);
}
