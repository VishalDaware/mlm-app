// prisma/fixHierarchy.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting data correction script...');

  // 1. Find the Admin user to get their actual database ID
  const adminUser = await prisma.user.findUnique({
    where: { userId: 'admin' },
    select: { id: true },
  });

  if (!adminUser) {
    console.error('Error: Admin user with userId "admin" not found. Please seed the database first.');
    return;
  }

  console.log(`Found Admin user with ID: ${adminUser.id}`);

  // 2. Find all Distributors whose uplineId is currently not set (null)
  const orphanedDistributors = await prisma.user.findMany({
    where: {
      role: 'Distributor',
      uplineId: null,
    },
  });

  if (orphanedDistributors.length === 0) {
    console.log('No orphaned distributors found. Data is already correct.');
    return;
  }

  console.log(`Found ${orphanedDistributors.length} orphaned distributor(s) to fix.`);

  // 3. Update all of them to set their uplineId to the Admin's ID
  const updateResult = await prisma.user.updateMany({
    where: {
      role: 'Distributor',
      uplineId: null,
    },
    data: {
      uplineId: adminUser.id,
    },
  });

  console.log(`Successfully updated ${updateResult.count} distributor(s).`);
  console.log('Data correction finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });