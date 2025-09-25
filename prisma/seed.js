const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password', salt);

  const admin = await prisma.user.upsert({
    where: { userId: 'admin' },
    update: {
      name: 'Admin User',
      password: hashedPassword,
      role: 'Admin',
    },
    create: {
      userId: 'admin',
      name: 'Admin User',
      password: hashedPassword,
      role: 'Admin',
    },
  });

  const distributor = await prisma.user.upsert({
    where: { userId: 'DIS3309' },
    update: {
      name: 'Kishor',
      password: hashedPassword,
      role: 'Distributor',
      uplineId: admin.id,
    },
    create: {
      userId: 'DIS3309',
      name: 'Kishor',
      password: hashedPassword,
      role: 'Distributor',
      uplineId: admin.id,
    },
  });

  const dealer1 = await prisma.user.upsert({
    where: { userId: 'DLR789' },
    update: {
      name: 'Rohan',
      password: hashedPassword,
      role: 'Dealer',
      uplineId: distributor.id,
    },
    create: {
      userId: 'DLR789',
      name: 'Rohan',
      password: hashedPassword,
      role: 'Dealer',
      uplineId: distributor.id,
    },
  });

  const dealer2 = await prisma.user.upsert({
    where: { userId: 'DLR790' },
    update: {
      name: 'Ved',
      password: hashedPassword,
      role: 'Dealer',
      uplineId: distributor.id,
    },
    create: {
      userId: 'DLR790',
      name: 'Ved',
      password: hashedPassword,
      role: 'Dealer',
      uplineId: distributor.id,
    },
  });

  const farmer = await prisma.user.upsert({
    where: { userId: 'FRM456' },
    update: { uplineId: dealer1.id },
    create: {
      userId: 'FRM456',
      name: 'Aditya',
      password: hashedPassword,
      role: 'Farmer',
      uplineId: dealer1.id, 
    },
  });
  
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });