
import { Prisma } from '@prisma/client';

const data: Prisma.UserCreateInput = {
    email: 'test@example.com',
    password: 'password',
    firstName: 'Test',
    lastName: 'User',
};

console.log(data);
