import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedKriteriaKtaTta() {
  console.log('🌱 Seeding Kriteria KTA/TTA...');

  const existingCount = await prisma.kriteriaKtaTta.count();
  
  if (existingCount > 0) {
    console.log('✅ Kriteria KTA/TTA already exists, skipping seed');
    return;
  }

  const kriteria = [
    { kriteria: 'Peralatan Bergerak', days: 14 },
    { kriteria: 'Pengelolaan Jalan dan Lalu lintas', days: 30 },
    { kriteria: 'Isolasi Energi', days: 7 },
    { kriteria: 'Pengelolaan Ban', days: 21 },
    { kriteria: 'Bekerja di dekat/atas air', days: 14 },
    { kriteria: 'Bejana bertekanan', days: 21 },
    { kriteria: 'Pelindung mesin / Mesin berat', days: 14 },
    { kriteria: 'Bahan kimia berbahaya dan beracun', days: 7 },
    { kriteria: 'House Keeping & Tata Lingkungan', days: 7 },
    { kriteria: 'Lain-lain', days: 21 }
  ];

  await prisma.kriteriaKtaTta.createMany({
    data: kriteria
  });

  console.log(`✅ Created ${kriteria.length} kriteria KTA/TTA records`);
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
