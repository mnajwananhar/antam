import { PrismaClient, UserRole, EquipmentStatus, NotificationUrgency, NotificationStatus, MaintenanceType, StatusTindakLanjut } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedKriteriaKtaTta } from './seeds/kriteria-kta-tta';
import { seedOperationalData } from './seeds/operational-data';
import { seedApprovalRequests } from './seeds/approval-requests';
import { seedHistoricalData } from './seeds/historical-data';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create departments
  console.log("📂 Creating departments...");
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { code: "MTCENG" },
      update: {},
      create: {
        name: "MTC&ENG Bureau",
        code: "MTCENG",
        description: "Maintenance & Engineering",
      },
    }),
    prisma.department.upsert({
      where: { code: "MMTC" },
      update: {},
      create: {
        name: "MMTC",
        code: "MMTC",
        description: "Mine Maintenance",
      },
    }),
    prisma.department.upsert({
      where: { code: "PMTC" },
      update: {},
      create: {
        name: "PMTC",
        code: "PMTC",
        description: "Plant Maintenance",
      },
    }),
    prisma.department.upsert({
      where: { code: "ECDC" },
      update: {},
      create: {
        name: "ECDC",
        code: "ECDC",
        description: "Electric Control & Distribution",
      },
    }),
    prisma.department.upsert({
      where: { code: "HETU" },
      update: {},
      create: {
        name: "HETU",
        code: "HETU",
        description: "Heavy Equipment & Tailing Utilization",
      },
    }),
  ]);

  console.log(`✅ Created ${departments.length} departments`);

  // Get department IDs for reference
  const mtcEngDept = departments.find((d) => d.code === "MTCENG")!;
  const mmtcDept = departments.find((d) => d.code === "MMTC")!;
  const pmtcDept = departments.find((d) => d.code === "PMTC")!;
  const ecdcDept = departments.find((d) => d.code === "ECDC")!;
  const hetuDept = departments.find((d) => d.code === "HETU")!;

  // Create equipment categories first
  console.log("📂 Creating equipment categories...");
  
  const equipmentCategories = await Promise.all([
    // Processing Equipment Categories
    prisma.equipmentCategory.upsert({
      where: { code: "BALL_MILL" },
      update: {},
      create: {
        name: "Ball Mill",
        code: "BALL_MILL",
      },
    }),
    prisma.equipmentCategory.upsert({
      where: { code: "CRUSHING" },
      update: {},
      create: {
        name: "Crushing",
        code: "CRUSHING",
      },
    }),
    prisma.equipmentCategory.upsert({
      where: { code: "BACKFILL" },
      update: {},
      create: {
        name: "Backfill Plant",
        code: "BACKFILL",
      },
    }),
    prisma.equipmentCategory.upsert({
      where: { code: "BACKFILL_DAM" },
      update: {},
      create: {
        name: "Back Fill Dam",
        code: "BACKFILL_DAM",
      },
    }),
    
    // Mobile Equipment Categories
    prisma.equipmentCategory.upsert({
      where: { code: "JUMBO_DRILL" },
      update: {},
      create: {
        name: "Jumbo Drill",
        code: "JUMBO_DRILL",
      },
    }),
    prisma.equipmentCategory.upsert({
      where: { code: "LHD" },
      update: {},
      create: {
        name: "Load Haul Dump",
        code: "LHD",
      },
    }),
    prisma.equipmentCategory.upsert({
      where: { code: "MINE_TRUCK" },
      update: {},
      create: {
        name: "Mine Truck",
        code: "MINE_TRUCK",
      },
    }),
    prisma.equipmentCategory.upsert({
      where: { code: "SHORTCRETE" },
      update: {},
      create: {
        name: "Shortcrete",
        code: "SHORTCRETE",
      },
    }),
    prisma.equipmentCategory.upsert({
      where: { code: "MIXER_TRUCK" },
      update: {},
      create: {
        name: "Mixer Truck",
        code: "MIXER_TRUCK",
      },
    }),
    prisma.equipmentCategory.upsert({
      where: { code: "TROLLEY_LOCO" },
      update: {},
      create: {
        name: "Trolley Locomotive",
        code: "TROLLEY_LOCO",
      },
    }),
  ]);

  console.log(`✅ Created ${equipmentCategories.length} equipment categories`);

  // Get category IDs for reference
  const ballMillCat = equipmentCategories.find((c) => c.code === "BALL_MILL")!;
  const crushingCat = equipmentCategories.find((c) => c.code === "CRUSHING")!;
  const backfillCat = equipmentCategories.find((c) => c.code === "BACKFILL")!;
  const backfillDamCat = equipmentCategories.find((c) => c.code === "BACKFILL_DAM")!;
  const jumboDrillCat = equipmentCategories.find((c) => c.code === "JUMBO_DRILL")!;
  const lhdCat = equipmentCategories.find((c) => c.code === "LHD")!;
  const mineTruckCat = equipmentCategories.find((c) => c.code === "MINE_TRUCK")!;
  const shortcreteCat = equipmentCategories.find((c) => c.code === "SHORTCRETE")!;
  const mixerTruckCat = equipmentCategories.find((c) => c.code === "MIXER_TRUCK")!;
  const trolleyLocoCat = equipmentCategories.find((c) => c.code === "TROLLEY_LOCO")!;

  // Create equipment with proper categories
  console.log("⚙️ Creating equipment with categories...");

  const equipmentData = [
    // Equipment tanpa department mapping di sini
    { name: "Ball Mill 1", code: "Ball Mill 1", categoryId: ballMillCat.id },
    { name: "Ball Mill 2", code: "Ball Mill 2", categoryId: ballMillCat.id },
    { name: "Crushing", code: "Crushing", categoryId: crushingCat.id },
    { name: "Backfill Plant 1", code: "Backfill Plant 1", categoryId: backfillCat.id },
    { name: "Backfill Plant 2", code: "Backfill Plant 2", categoryId: backfillCat.id },
    { name: "Back Fill Dam", code: "Back Fill Dam", categoryId: backfillDamCat.id },

    // Jumbo Drill equipment (01-07)
    ...Array.from({ length: 7 }, (_, i) => ({
      name: `Jumbo Drill ${String(i + 1).padStart(2, "0")}`,
      code: `08DR${String(i + 1).padStart(3, "0")}`,
      categoryId: jumboDrillCat.id,
    })),

    // Load Haul Dump (LHD) - specific numbers: 1,3,4,6,7,8,9
    ...[1, 3, 4, 6, 7, 8, 9].map((num) => ({
      name: `Load Haul Dump ${String(num).padStart(2, "0")}`,
      code: `08LH${String(num).padStart(3, "0")}`,
      categoryId: lhdCat.id,
    })),

    // Mine Truck (01-03)
    ...Array.from({ length: 3 }, (_, i) => ({
      name: `Mine Truck ${String(i + 1).padStart(2, "0")}`,
      code: `08MT${String(i + 1).padStart(3, "0")}`,
      categoryId: mineTruckCat.id,
    })),

    // Shortcrete
    { name: "Shortcrete 02", code: "08SC002", categoryId: shortcreteCat.id },

    // Mixer Truck (01-02)
    ...Array.from({ length: 2 }, (_, i) => ({
      name: `Mixer Truck ${String(i + 1).padStart(2, "0")}`,
      code: `08MIX${String(i + 1).padStart(3, "0")}`,
      categoryId: mixerTruckCat.id,
    })),

    // Trolley Locomotive - specific numbers: 2,3,4,5,6,7
    ...[2, 3, 4, 5, 6, 7].map((num) => ({
      name: `Trolley Locomotive ${String(num).padStart(3, "0")}`,
      code: `08TL${String(num).padStart(3, "0")}`,
      categoryId: trolleyLocoCat.id,
    })),
  ];

  const equipment = await Promise.all(
    equipmentData.map((eq) =>
      prisma.equipment.upsert({
        where: { code: eq.code },
        update: {},
        create: eq,
      })
    )
  );

  console.log(`✅ Created ${equipment.length} equipment`);

  // Create Equipment Department Mappings (simple mapping berdasarkan nama equipment)
  console.log("🔗 Creating equipment department mappings...");
  
  const equipmentMappings = [
    // Ball Mill -> PMTC
    { equipmentCode: "Ball Mill 1", departmentCode: "PMTC" },
    { equipmentCode: "Ball Mill 2", departmentCode: "PMTC" },
    { equipmentCode: "Crushing", departmentCode: "PMTC" },
    { equipmentCode: "Backfill Plant 1", departmentCode: "PMTC" },
    { equipmentCode: "Backfill Plant 2", departmentCode: "PMTC" },
    { equipmentCode: "Back Fill Dam", departmentCode: "PMTC" },
    
    // Jumbo Drill -> MMTC
    { equipmentCode: "08DR001", departmentCode: "MMTC" },
    { equipmentCode: "08DR002", departmentCode: "MMTC" },
    { equipmentCode: "08DR003", departmentCode: "MMTC" },
    { equipmentCode: "08DR004", departmentCode: "MMTC" },
    { equipmentCode: "08DR005", departmentCode: "MMTC" },
    { equipmentCode: "08DR006", departmentCode: "MMTC" },
    { equipmentCode: "08DR007", departmentCode: "MMTC" },
    
    // LHD -> MMTC
    { equipmentCode: "08LH001", departmentCode: "MMTC" },
    { equipmentCode: "08LH003", departmentCode: "MMTC" },
    { equipmentCode: "08LH004", departmentCode: "MMTC" },
    { equipmentCode: "08LH006", departmentCode: "MMTC" },
    { equipmentCode: "08LH007", departmentCode: "MMTC" },
    { equipmentCode: "08LH008", departmentCode: "MMTC" },
    { equipmentCode: "08LH009", departmentCode: "MMTC" },
    
    // Mine Truck -> MMTC
    { equipmentCode: "08MT001", departmentCode: "MMTC" },
    { equipmentCode: "08MT002", departmentCode: "MMTC" },
    { equipmentCode: "08MT003", departmentCode: "MMTC" },
    
    // Shortcrete -> ECDC (moved for temporary assignment)
    { equipmentCode: "08SC002", departmentCode: "ECDC" },
    
    // Mixer Truck -> Split between MMTC and ECDC
    { equipmentCode: "08MIX001", departmentCode: "ECDC" },
    { equipmentCode: "08MIX002", departmentCode: "MMTC" },
    
    // Trolley Locomotive -> HETU
    { equipmentCode: "08TL002", departmentCode: "HETU" },
    { equipmentCode: "08TL003", departmentCode: "HETU" },
    { equipmentCode: "08TL004", departmentCode: "HETU" },
    { equipmentCode: "08TL005", departmentCode: "HETU" },
    { equipmentCode: "08TL006", departmentCode: "HETU" },
    { equipmentCode: "08TL007", departmentCode: "HETU" },
    
  ];

  for (const mapping of equipmentMappings) {
    const eq = equipment.find(e => e.code === mapping.equipmentCode);
    const dept = departments.find(d => d.code === mapping.departmentCode);
    
    if (eq && dept) {
      await prisma.equipmentDepartment.upsert({
        where: {
          equipmentId_departmentId: {
            equipmentId: eq.id,
            departmentId: dept.id,
          }
        },
        update: {},
        create: {
          equipmentId: eq.id,
          departmentId: dept.id,
        }
      });
    }
  }

  console.log(`✅ Created ${equipmentMappings.length} equipment department mappings`);

  // Create Department PIC Mappings
  console.log("🗂️ Creating department PIC mappings...");
  const departmentPicMappings = [
    { departmentCode: "HETU", picValue: "HETU" },
    { departmentCode: "HETU", picValue: "HE-TU" },
    { departmentCode: "PMTC", picValue: "PMTC" },
    { departmentCode: "PMTC", picValue: "Plant Maintenance & Civil" },
    { departmentCode: "ECDC", picValue: "ECDC" },
    { departmentCode: "MMTC", picValue: "MMTC" },
    { departmentCode: "MMTC", picValue: "Mine Electrical" },
    { departmentCode: "MMTC", picValue: "Mine Maintenance" },
  ];

  await prisma.departmentPicMapping.createMany({
    data: departmentPicMappings,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${departmentPicMappings.length} department PIC mappings`);

  // Create users FIRST (dependency for equipment status history)
  console.log("👥 Creating users...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  const users = await Promise.all([
    // Admin user
    prisma.user.upsert({
      where: { username: "admin" },
      update: {},
      create: {
        username: "admin",
        password: hashedPassword,
        role: UserRole.ADMIN,
      },
    }),

    // Planner users - one for each department
    prisma.user.upsert({
      where: { username: "planner_mtceng" },
      update: {},
      create: {
        username: "planner_mtceng",
        password: hashedPassword,
        role: UserRole.PLANNER,
        departmentId: mtcEngDept.id,
      },
    }),
    prisma.user.upsert({
      where: { username: "planner_mmtc" },
      update: {},
      create: {
        username: "planner_mmtc",
        password: hashedPassword,
        role: UserRole.PLANNER,
        departmentId: mmtcDept.id,
      },
    }),
    prisma.user.upsert({
      where: { username: "planner_pmtc" },
      update: {},
      create: {
        username: "planner_pmtc",
        password: hashedPassword,
        role: UserRole.PLANNER,
        departmentId: pmtcDept.id,
      },
    }),
    prisma.user.upsert({
      where: { username: "planner_ecdc" },
      update: {},
      create: {
        username: "planner_ecdc",
        password: hashedPassword,
        role: UserRole.PLANNER,
        departmentId: ecdcDept.id,
      },
    }),
    prisma.user.upsert({
      where: { username: "planner_hetu" },
      update: {},
      create: {
        username: "planner_hetu",
        password: hashedPassword,
        role: UserRole.PLANNER,
        departmentId: hetuDept.id,
      },
    }),

    // Inputter users - one for each shift
    prisma.user.upsert({
      where: { username: "inputter_shift1" },
      update: {},
      create: {
        username: "inputter_shift1",
        password: hashedPassword,
        role: UserRole.INPUTTER,
      },
    }),
    prisma.user.upsert({
      where: { username: "inputter_shift2" },
      update: {},
      create: {
        username: "inputter_shift2",
        password: hashedPassword,
        role: UserRole.INPUTTER,
      },
    }),
    prisma.user.upsert({
      where: { username: "inputter_shift3" },
      update: {},
      create: {
        username: "inputter_shift3",
        password: hashedPassword,
        role: UserRole.INPUTTER,
      },
    }),
    prisma.user.upsert({
      where: { username: "inputter_longshift1" },
      update: {},
      create: {
        username: "inputter_longshift1",
        password: hashedPassword,
        role: UserRole.INPUTTER,
      },
    }),
    prisma.user.upsert({
      where: { username: "inputter_longshift2" },
      update: {},
      create: {
        username: "inputter_longshift2",
        password: hashedPassword,
        role: UserRole.INPUTTER,
      },
    }),

    // Viewer user
    prisma.user.upsert({
      where: { username: "viewer" },
      update: {},
      create: {
        username: "viewer",
        password: hashedPassword,
        role: UserRole.VIEWER,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create initial equipment status history AFTER users are created
  console.log("📊 Creating initial equipment status...");
  const adminUser = users.find((u) => u.username === "admin");

  if (!adminUser) {
    throw new Error(
      "Admin user not found. Cannot proceed with equipment status creation."
    );
  }

  await Promise.all(
    equipment.map((eq) =>
      prisma.equipmentStatusHistory.create({
        data: {
          equipmentId: eq.id,
          status: EquipmentStatus.WORKING,
          changedById: adminUser.id,
          notes: "Initial status",
        },
      })
    )
  );

  console.log("✅ Created initial equipment status history");

  // Create sample safety incident data for current year
  console.log("🚨 Creating sample safety incident data...");
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  for (let month = 1; month <= currentMonth; month++) {
    await prisma.safetyIncident.upsert({
      where: { month_year: { month, year: currentYear } },
      update: {},
      create: {
        month,
        year: currentYear,
        nearmiss: Math.floor(Math.random() * 5),
        kecAlat: Math.floor(Math.random() * 3),
        kecKecil: Math.floor(Math.random() * 2),
        kecRingan: Math.floor(Math.random() * 2),
        kecBerat: 0,
        fatality: 0,
      },
    });
  }

  // Create sample energy targets for current year
  console.log("⚡ Creating sample energy targets...");
  for (let month = 1; month <= 12; month++) {
    await prisma.energyTarget.upsert({
      where: { year_month: { year: currentYear, month } },
      update: {},
      create: {
        year: currentYear,
        month,
        ikesTarget: 50 + Math.random() * 20, // Random target between 50-70
        emissionTarget: 1000 + Math.random() * 500, // Random target between 1000-1500
      },
    });

    // Also create realizations for past months
    if (month < currentMonth) {
      await prisma.energyRealization.upsert({
        where: { year_month: { year: currentYear, month } },
        update: {},
        create: {
          year: currentYear,
          month,
          ikesRealization: 45 + Math.random() * 25, // Random realization
          emissionRealization: 950 + Math.random() * 600, // Random realization
        },
      });
    }
  }

  // Create sample energy consumption data
  console.log("🔌 Creating sample energy consumption data...");
  for (let month = 1; month < currentMonth; month++) {
    await prisma.energyConsumption.upsert({
      where: { year_month: { year: currentYear, month } },
      update: {},
      create: {
        year: currentYear,
        month,
        tambangConsumption: 800 + Math.random() * 400,
        pabrikConsumption: 1200 + Math.random() * 600,
        supportingConsumption: 400 + Math.random() * 200,
      },
    });
  }

  // Seed Kriteria KTA/TTA
  await seedKriteriaKtaTta();

  // Create sample KTA & TTA data
  console.log("📋 Creating sample KTA & TTA data...");
  const inputterUser = users.find((u) => u.username === "inputter_shift1")!;
  const kriteriaList = await prisma.kriteriaKtaTta.findMany();
  
  const sampleKtaData = [
    {
      noRegister: "KTA-MMTC-2025-001",
      nppPelapor: "NPP001",
      namaPelapor: "Ahmad Suryadi",
      perusahaanBiro: "PT ANTAM Tbk",
      tanggal: new Date('2025-07-15'),
      lokasi: "Area Tambang Level 250",
      areaTemuan: "Shaft Utama",
      keterangan: "Ditemukan kebocoran oli hidraulik pada LHD 08LH003",
      kategori: "Mechanical",
      sumberTemuan: "Inspeksi Rutin",
      picDepartemen: "MMTC",
      kriteriaKtaTta: kriteriaList[0]?.kriteria || "Peralatan Bergerak",
      perusahaanPengelola: "PT ANTAM",
      tindakLanjutLangsung: "Perbaikan seal hidraulik dan penggantian oli",
      statusTindakLanjut: StatusTindakLanjut.OPEN,
      biro: "MMTC",
      dueDate: new Date('2025-07-29'),
      updateStatus: "Proses",
      createdById: inputterUser.id,
    },
    {
      noRegister: "KTA-PMTC-2025-002",
      nppPelapor: "NPP002",
      namaPelapor: "Budi Santoso",
      perusahaanBiro: "PT ANTAM Tbk",
      tanggal: new Date('2025-07-20'),
      lokasi: "Ball Mill Area",
      areaTemuan: "Processing Plant",
      keterangan: "Suara tidak normal pada bearing Ball Mill 1",
      kategori: "Mechanical",
      sumberTemuan: "Operator Report",
      picDepartemen: "PMTC",
      kriteriaKtaTta: kriteriaList[6]?.kriteria || "Pelindung mesin / Mesin berat",
      perusahaanPengelola: "PT ANTAM",
      tindakLanjutLangsung: "Inspeksi bearing dan jadwal penggantian",
      statusTindakLanjut: StatusTindakLanjut.OPEN,
      biro: "PMTC",
      dueDate: new Date('2025-08-03'),
      updateStatus: "Proses",
      createdById: inputterUser.id,
    },
    {
      noRegister: "KTA-ECDC-2025-003",
      nppPelapor: "NPP003",
      namaPelapor: "Candra Wijaya",
      perusahaanBiro: "PT ANTAM Tbk",
      tanggal: new Date('2025-07-10'),
      lokasi: "Main Distribution Panel",
      areaTemuan: "Electrical Room",
      keterangan: "Ditemukan kabel yang tidak terlindungi dengan baik",
      kategori: "Electrical",
      sumberTemuan: "Safety Inspection",
      picDepartemen: "ECDC",
      kriteriaKtaTta: kriteriaList[2]?.kriteria || "Isolasi Energi",
      perusahaanPengelola: "PT ANTAM",
      tindakLanjutLangsung: "Pemasangan cable tray dan isolasi tambahan",
      statusTindakLanjut: StatusTindakLanjut.CLOSE,
      biro: "ECDC",
      dueDate: new Date('2025-07-17'),
      updateStatus: "Close",
      createdById: inputterUser.id,
    }
  ];

  // Create sample KPI Utama data
  const sampleKpiData = [
    {
      noRegister: "KPI-MTCENG-2025-001",
      nppPelapor: "NPP004",
      namaPelapor: "Dedi Kurniawan",
      perusahaanBiro: "PT ANTAM Tbk",
      tanggal: new Date('2025-07-25'),
      lokasi: "Workshop Maintenance",
      areaTemuan: "Tool Management",
      keterangan: "Optimalisasi penggunaan spare parts untuk mengurangi downtime",
      kategori: "Process Improvement",
      sumberTemuan: "Analysis Report",
      picDepartemen: "MTC&ENG Bureau",
      kriteriaKtaTta: "Lain-lain",
      perusahaanPengelola: "PT ANTAM",
      tindakLanjutLangsung: "Implementasi sistem inventory real-time",
      statusTindakLanjut: StatusTindakLanjut.OPEN,
      biro: "MTC&ENG Bureau",
      dueDate: new Date('2025-08-15'),
      updateStatus: "Proses",
      createdById: inputterUser.id,
    },
    {
      noRegister: "KPI-MTCENG-2025-002",
      nppPelapor: "NPP005",
      namaPelapor: "Eko Prasetyo",
      perusahaanBiro: "PT ANTAM Tbk",
      tanggal: new Date('2025-07-18'),
      lokasi: "All Departments",
      areaTemuan: "Energy Management",
      keterangan: "Program efisiensi energi untuk mencapai target IKES bulanan",
      kategori: "Energy Efficiency",
      sumberTemuan: "Monthly Review",
      picDepartemen: "ECDC",
      kriteriaKtaTta: "Lain-lain",
      perusahaanPengelola: "PT ANTAM",
      tindakLanjutLangsung: "Audit penggunaan listrik per area",
      statusTindakLanjut: StatusTindakLanjut.OPEN,
      biro: "MTC&ENG Bureau",
      dueDate: new Date('2025-08-08'),
      updateStatus: "Proses",
      createdById: inputterUser.id,
    }
  ];

  await prisma.ktaKpiData.createMany({
    data: [...sampleKtaData, ...sampleKpiData],
    skipDuplicates: true,
  });

  console.log(`✅ Created ${sampleKtaData.length + sampleKpiData.length} KTA/TTA and KPI data records`);

  // Create sample notifications
  console.log("🔔 Creating sample notifications...");
  const today = new Date();
  const sampleNotifications = [
    {
      uniqueNumber: "MMTC-24072025-001",
      departmentId: mmtcDept.id,
      reportTime: new Date(`${today.toISOString().split('T')[0]}T08:30:00Z`),
      urgency: NotificationUrgency.URGENT,
      problemDetail: "LHD 08LH006 mengalami kerusakan sistem hidraulik, tidak dapat beroperasi",
      status: NotificationStatus.PROCESS,
      type: MaintenanceType.CORM,
      createdById: inputterUser.id,
    },
    {
      uniqueNumber: "PMTC-25072025-001",
      departmentId: pmtcDept.id,
      reportTime: new Date(`${today.toISOString().split('T')[0]}T14:15:00Z`),
      urgency: NotificationUrgency.NORMAL,
      problemDetail: "Ball Mill 2 membutuhkan penggantian liner yang sudah aus",
      status: NotificationStatus.COMPLETE,
      type: MaintenanceType.CORM,
      createdById: inputterUser.id,
    },
    {
      uniqueNumber: "ECDC-26072025-001",
      departmentId: ecdcDept.id,
      reportTime: new Date(`${today.toISOString().split('T')[0]}T10:45:00Z`),
      urgency: NotificationUrgency.EMERGENCY,
      problemDetail: "Short circuit pada panel listrik utama, perlu penanganan segera",
      status: NotificationStatus.PROCESS,
      type: MaintenanceType.CORM,
      createdById: inputterUser.id,
    }
  ];

  const notifications = await Promise.all(
    sampleNotifications.map((notif) =>
      prisma.notification.upsert({
        where: { uniqueNumber: notif.uniqueNumber },
        update: {},
        create: notif,
      })
    )
  );

  console.log(`✅ Created ${notifications.length} notifications`);

  // Create sample critical issues
  console.log("⚠️ Creating sample critical issues...");
  const plannerMmtc = users.find((u) => u.username === "planner_mmtc")!;
  const sampleCriticalIssues = [
    {
      issueName: "Kerusakan Major pada Crushing Plant",
      departmentId: pmtcDept.id,
      status: "INVESTIGASI" as any,
      description: "Jaw crusher mengalami kerusakan pada main bearing, produksi terhenti total",
      createdById: inputterUser.id,
    },
    {
      issueName: "Shortage Spare Parts untuk LHD",
      departmentId: mmtcDept.id,
      status: "PROSES" as any,
      description: "Stok spare parts untuk LHD habis, beberapa unit tidak dapat beroperasi optimal",
      createdById: plannerMmtc.id,
    },
    {
      issueName: "Gangguan Sistem Kelistrikan Utama",
      departmentId: ecdcDept.id,
      status: "SELESAI" as any,
      description: "Fluktuasi tegangan pada sistem distribusi utama, perlu monitoring ketat",
      createdById: users.find((u) => u.username === "planner_ecdc")!.id,
    }
  ];

  await prisma.criticalIssue.createMany({
    data: sampleCriticalIssues,
  });

  console.log(`✅ Created ${sampleCriticalIssues.length} critical issues`);

  // Seed operational data (orders, maintenance, reports)
  await seedOperationalData();

  // Seed approval requests
  await seedApprovalRequests();

  // Seed historical data for trending/analytics
  await seedHistoricalData();

  console.log("🎉 Database seeding completed successfully!");
  console.log("\n📝 Default login credentials:");
  console.log("Admin: admin / password123");
  console.log("Planner MTC&ENG: planner_mtceng / password123");
  console.log("Planner MMTC: planner_mmtc / password123");
  console.log("Planner PMTC: planner_pmtc / password123");
  console.log("Planner ECDC: planner_ecdc / password123");
  console.log("Planner HETU: planner_hetu / password123");
  console.log("Inputter Shift 1: inputter_shift1 / password123");
  console.log("Inputter Shift 2: inputter_shift2 / password123");
  console.log("Inputter Shift 3: inputter_shift3 / password123");
  console.log("Inputter Long Shift 1: inputter_longshift1 / password123");
  console.log("Inputter Long Shift 2: inputter_longshift2 / password123");
  console.log("Viewer: viewer / password123");
  console.log("\n📋 Sample Data Created:");
  console.log("- 5 Departments with equipment categories and 32 equipment items");
  console.log("- 12 User accounts across all roles");
  console.log("- Sample KTA/TTA and KPI Utama data");
  console.log("- Notifications and work orders");
  console.log("- Critical issues and maintenance routines");
  console.log("- Historical operational reports (30 days)");
  console.log("- Safety incidents and energy consumption data");
  console.log("- Approval workflow examples");
  console.log("\n🚀 Your database is now ready for development and testing!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
