import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedJobLibrary() {
  console.log("🌱 Seeding Job Library data...");

  // Create job objects (materials) first
  const jobObjects = await Promise.all([
    prisma.jobObject.create({
      data: {
        materialNumber: "MAT-001",
        materialName: "Bearing 6205",
      },
    }),
    prisma.jobObject.create({
      data: {
        materialNumber: "MAT-002", 
        materialName: "Motor Oil SAE 20W-50",
      },
    }),
    prisma.jobObject.create({
      data: {
        materialNumber: "MAT-003",
        materialName: "Belt V Type A32",
      },
    }),
    prisma.jobObject.create({
      data: {
        materialNumber: "MAT-004",
        materialName: "Grease Lithium",
      },
    }),
    prisma.jobObject.create({
      data: {
        materialNumber: "MAT-005",
        materialName: "Filter Udara K&N",
      },
    }),
  ]);

  // Create job library with activities
  const jobLibrary1 = await prisma.jobLibrary.create({
    data: {
      jobName: "Preventive Maintenance Conveyor",
      description: "Perawatan rutin untuk conveyor belt termasuk pembersihan, pelumasan, dan inspeksi",
      activities: {
        create: [
          {
            activity: "Pembersihan conveyor belt",
            objectId: jobObjects[2].id, // Belt V Type A32
          },
          {
            activity: "Pelumasan bearing motor",
            objectId: jobObjects[1].id, // Motor Oil SAE 20W-50
          },
          {
            activity: "Inspeksi dan penggantian bearing",
            objectId: jobObjects[0].id, // Bearing 6205
          },
        ],
      },
    },
  });

  const jobLibrary2 = await prisma.jobLibrary.create({
    data: {
      jobName: "Overhaul Pompa Sentrifugal",
      description: "Pembongkaran total dan perbaikan pompa sentrifugal",
      activities: {
        create: [
          {
            activity: "Pembongkaran housing pompa",
            objectId: jobObjects[0].id, // Bearing 6205
          },
          {
            activity: "Penggantian impeller dan bearing",
            objectId: jobObjects[0].id, // Bearing 6205
          },
          {
            activity: "Pemasangan kembali dengan grease baru",
            objectId: jobObjects[3].id, // Grease Lithium
          },
        ],
      },
    },
  });

  const jobLibrary3 = await prisma.jobLibrary.create({
    data: {
      jobName: "Service Generator Set",
      description: "Perawatan berkala generator set meliputi penggantian filter dan oli",
      activities: {
        create: [
          {
            activity: "Penggantian filter udara",
            objectId: jobObjects[4].id, // Filter Udara K&N
          },
          {
            activity: "Penggantian oli engine",
            objectId: jobObjects[1].id, // Motor Oil SAE 20W-50
          },
          {
            activity: "Pelumasan bearing alternator",
            objectId: jobObjects[3].id, // Grease Lithium
          },
        ],
      },
    },
  });

  console.log("✅ Job Library seeded successfully!");
  console.log(`Created ${jobObjects.length} job objects`);
  console.log(`Created 3 job libraries with activities`);
}

seedJobLibrary()
  .catch((e) => {
    console.error("❌ Error seeding job library:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });