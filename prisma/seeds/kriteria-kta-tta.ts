import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedKriteriaKtaTta() {
  console.log('🌱 Seeding Kriteria KTA/TTA (UPDATED - NO DAYS COLUMN)...');

  // Delete existing data first
  await prisma.kriteriaKtaTta.deleteMany({});
  console.log('🗑️ Cleared existing kriteria data');

  const kriteria = [
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

  await prisma.kriteriaKtaTta.createMany({
    data: kriteria,
    skipDuplicates: true
  });

  console.log(`✅ Created ${kriteria.length} kriteria KTA/TTA records (WITHOUT days column)`);
  console.log('🎯 Days mapping now HARDCODED in utils/kta-tta.ts file');
}

if (require.main === module) {
  seedKriteriaKtaTta()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
