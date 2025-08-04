import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedKriteriaKtaTta() {
  console.log('🌱 Seeding Kriteria KTA/TTA...');
  
  const defaultKriteria = [
    { kriteria: 'Peralatan Bergerak' },
    { kriteria: 'Pengelolaan Jalan dan Lalu lintas' },
    { kriteria: 'Isolasi Energi' },
    { kriteria: 'Pengelolaan Ban' },
    { kriteria: 'Bekerja di dekat/atas air' },
    { kriteria: 'Bejana bertekanan' },
    { kriteria: 'Pelindung mesin / Mesin berat' },
    { kriteria: 'Bahan kimia berbahaya dan beracun' },
    { kriteria: 'House Keeping & Tata Lingkungan' },
    { kriteria: 'Lain-lain' }
  ];

  // Check if data already exists
  const existingCount = await prisma.kriteriaKtaTta.count();
  
  if (existingCount === 0) {
    await prisma.kriteriaKtaTta.createMany({
      data: defaultKriteria,
      skipDuplicates: true
    });
    console.log(`✅ Created ${defaultKriteria.length} default kriteria`);
  } else {
    console.log(`ℹ️ ${existingCount} kriteria already exist, skipping seed`);
  }
}

async function main() {
  try {
    await seedKriteriaKtaTta();
    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
