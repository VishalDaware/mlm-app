import { PrismaClient } from '@prisma/client';

// This function creates a new instance of the Prisma client.
const prismaClientSingleton = () => {
  return new PrismaClient();
};

// This ensures that we are using the correct global object.
const globalForPrisma = globalThis;

// This is the core of the fix:
// If a prisma instance doesn't already exist on the global object, create one.
// Otherwise, reuse the existing one.
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

// In development, we attach the prisma instance to the global object.
// This prevents Next.js's hot-reloading from creating too many new connections.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
