// Script to seed mock clients for development with minimal fields
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding mock clients...');
  
  try {
    const client1 = await prisma.client.create({
      data: {
        name: 'Mock Client 1',
      },
    });
    console.log(`Created client: ${client1.name} (ID: ${client1.id})`);
    
    const client2 = await prisma.client.create({
      data: {
        name: 'Mock Client 2',
      },
    });
    console.log(`Created client: ${client2.name} (ID: ${client2.id})`);
    
    console.log('Seeding complete!');
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      console.log('Clients already exist, skipping...');
    } else {
      throw error;
    }
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
