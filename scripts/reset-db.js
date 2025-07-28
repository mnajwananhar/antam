/**
 * Database Reset Script
 * Membersihkan data equipment lama dan menjalankan seed ulang dengan kategori yang benar
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log("🔄 Starting database reset...");

  try {
    // Delete existing equipment status history
    console.log("🗑️  Deleting equipment status history...");
    await prisma.equipmentStatusHistory.deleteMany({});

    // Delete existing operational reports and activities
    console.log("🗑️  Deleting operational reports...");
    await prisma.activityDetail.deleteMany({});
    await prisma.operationalReport.deleteMany({});

    // Delete existing equipment
    console.log("🗑️  Deleting equipment...");
    await prisma.equipment.deleteMany({});

    // Delete existing equipment categories
    console.log("🗑️  Deleting equipment categories...");
    await prisma.equipmentCategory.deleteMany({});

    console.log("✅ Database cleaned successfully!");
    console.log("🌱 Running seed to recreate data with categories...");

    // Run seed script
    const { execSync } = require('child_process');
    execSync('npm run db:seed', { stdio: 'inherit' });

    console.log("🎉 Database reset completed successfully!");
  } catch (error) {
    console.error("❌ Error during database reset:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
