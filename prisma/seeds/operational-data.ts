import { PrismaClient, EquipmentStatus, MaintenanceType } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedOperationalData() {
  console.log("🌱 Seeding Operational Data (Maintenance, Reports)...");

  // Get required references
  const departments = await prisma.department.findMany();
  const equipment = await prisma.equipment.findMany();
  const users = await prisma.user.findMany();
  const notifications = await prisma.notification.findMany();

  const mmtcDept = departments.find((d) => d.code === "MMTC")!;
  const pmtcDept = departments.find((d) => d.code === "PMTC")!;
  const mtcEngDept = departments.find((d) => d.code === "MTCENG")!;

  const plannerMmtc = users.find((u) => u.username === "planner_mmtc")!;
  const plannerPmtc = users.find((u) => u.username === "planner_pmtc")!;
  const plannerMtcEng = users.find((u) => u.username === "planner_mtceng")!;
  const inputterUser = users.find((u) => u.username === "inputter_shift1")!;

  // Get ALL active equipment for comprehensive operational reports
  const allActiveEquipment = equipment.filter(eq => eq.isActive);;

  // Create sample orders ONLY from existing notifications
  console.log("📋 Creating sample orders from notifications...");
  let ordersCreated = 0;

  // Only create orders if we have notifications
  if (notifications.length > 0) {
    // Create order from first notification (MMTC - LHD hydraulic issue)
    const firstNotification = notifications.find((n) =>
      n.uniqueNumber.includes("MMTC")
    );
    if (firstNotification) {
      const existingOrder = await prisma.order.findFirst({
        where: { notificationId: firstNotification.id },
      });

      if (!existingOrder) {
        const order = await prisma.order.create({
          data: {
            notificationId: firstNotification.id,
            jobName: "Perbaikan Sistem Hidraulik LHD 08LH006",
            startDate: new Date("2025-07-25"),
            endDate: new Date("2025-07-27"),
            description: "Mengganti seal hidraulik, filter, dan oli hidraulik",
            createdById: plannerMmtc.id,
          },
        });

        // Create order activities
        const activities = [
          {
            activity: "Diagnostic sistem hidraulik",
            object: "LHD 08LH006",
            isCompleted: true,
          },
          {
            activity: "Penggantian seal",
            object: "Hydraulic Cylinder",
            isCompleted: true,
          },
          {
            activity: "Penggantian filter hidraulik",
            object: "Filter Housing",
            isCompleted: false,
          },
          {
            activity: "Pengisian oli hidraulik",
            object: "Hydraulic Tank",
            isCompleted: false,
          },
          {
            activity: "Testing sistem",
            object: "LHD 08LH006",
            isCompleted: false,
          },
        ];

        await Promise.all(
          activities.map((activity) =>
            prisma.orderActivity.create({
              data: {
                orderId: order.id,
                ...activity,
              },
            })
          )
        );
        ordersCreated++;
      }
    }

    // Create order from PMTC notification (Ball Mill liner replacement)
    const pmtcNotification = notifications.find((n) =>
      n.uniqueNumber.includes("PMTC")
    );
    if (pmtcNotification) {
      const existingOrder = await prisma.order.findFirst({
        where: { notificationId: pmtcNotification.id },
      });

      if (!existingOrder) {
        const order = await prisma.order.create({
          data: {
            notificationId: pmtcNotification.id,
            jobName: "Penggantian Liner Ball Mill 2",
            startDate: new Date("2025-07-26"),
            endDate: new Date("2025-07-28"),
            description: "Mengganti liner Ball Mill 2 yang sudah aus",
            createdById: plannerPmtc.id,
          },
        });

        // Create order activities
        const activities = [
          {
            activity: "Shutdown Ball Mill 2",
            object: "Ball Mill 2",
            isCompleted: true,
          },
          {
            activity: "Pembongkaran liner lama",
            object: "Mill Shell",
            isCompleted: true,
          },
          {
            activity: "Pemasangan liner baru",
            object: "Mill Shell",
            isCompleted: true,
          },
          {
            activity: "Commissioning",
            object: "Ball Mill 2",
            isCompleted: true,
          },
          {
            activity: "Start up testing",
            object: "Ball Mill 2",
            isCompleted: true,
          },
        ];

        await Promise.all(
          activities.map((activity) =>
            prisma.orderActivity.create({
              data: {
                orderId: order.id,
                ...activity,
              },
            })
          )
        );
        ordersCreated++;
      }
    }
  }

  console.log(
    `✅ Created ${ordersCreated} orders with activities from existing notifications`
  );

  // Create sample maintenance routine (PREM type for preventive maintenance)
  console.log("🔧 Creating sample maintenance routine...");
  const currentDate = new Date();
  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}${month}${year}`;
  };

  const maintenanceRoutineData = [
    {
      uniqueNumber: `MTCENG-${formatDate(currentDate)}-001`,
      jobName: "Preventive Maintenance Monthly - Juli 2025",
      startDate: new Date("2025-07-20"),
      endDate: new Date("2025-07-22"),
      description: "Pemeliharaan rutin bulanan untuk semua equipment",
      type: MaintenanceType.PREM, // Preventive Maintenance
      departmentId: mtcEngDept.id,
      createdById: plannerMtcEng.id,
      activities: [
        { activity: "Inspeksi visual", object: "Semua Equipment" },
        { activity: "Pelumasan", object: "Bearing dan Grease Point" },
        { activity: "Pengecekan level oli", object: "Hydraulic System" },
        { activity: "Cleaning", object: "Radiator dan Filter" },
      ],
    },
    {
      uniqueNumber: `MMTC-${formatDate(currentDate)}-001`,
      jobName: "Preventive Maintenance LHD Fleet",
      startDate: new Date("2025-07-21"),
      endDate: new Date("2025-07-23"),
      description: "PM rutin untuk semua unit LHD",
      type: MaintenanceType.PREM, // Preventive Maintenance
      departmentId: mmtcDept.id,
      createdById: plannerMmtc.id,
      activities: [
        { activity: "Engine oil change", object: "All LHD Units" },
        { activity: "Hydraulic filter change", object: "Hydraulic System" },
        { activity: "Brake inspection", object: "Brake System" },
        { activity: "Tire pressure check", object: "Tires" },
      ],
    },
  ];

  let maintenanceCreated = 0;
  for (const maintenanceData of maintenanceRoutineData) {
    const { activities, ...maintenanceInfo } = maintenanceData;

    const existingMaintenance = await prisma.maintenanceRoutine.findUnique({
      where: { uniqueNumber: maintenanceInfo.uniqueNumber },
    });

    if (!existingMaintenance) {
      const maintenance = await prisma.maintenanceRoutine.create({
        data: maintenanceInfo,
      });

      // Create maintenance activities
      await Promise.all(
        activities.map((activity) =>
          prisma.maintenanceActivity.create({
            data: {
              maintenanceRoutineId: maintenance.id,
              ...activity,
            },
          })
        )
      );
      maintenanceCreated++;
    }
  }

  console.log(
    `✅ Created ${maintenanceCreated} maintenance routines with activities`
  );

  // Create more comprehensive operational reports with detailed activities for last 7 days
  console.log("📊 Creating comprehensive operational reports for the last week...");

  const today = new Date();
  const operationalReportsData = [];

  // Helper function to create safe datetime strings
  const createSafeDateTime = (date: Date, hour: number): Date => {
    const safeHour = Math.min(23, Math.max(0, hour));
    return new Date(`${date.toISOString().split("T")[0]}T${String(safeHour).padStart(2, '0')}:00:00`);
  };

  // Helper function to get equipment department
  const getEquipmentDepartment = async (equipmentId: number) => {
    const equipmentDept = await prisma.equipmentDepartment.findFirst({
      where: { equipmentId, isActive: true },
      include: { department: true }
    });
    return equipmentDept?.department || pmtcDept; // Default to PMTC if not found
  };

  // Helper function to generate operational patterns based on equipment type
  const getOperationalPattern = (equipmentCode: string) => {
    if (equipmentCode.includes('Ball Mill')) {
      return { baseWorking: 18, variability: 4, breakdownChance: 0.2, operatesWeekend: true, description: "Grinding operation" };
    } else if (equipmentCode.includes('Crushing')) {
      return { baseWorking: 20, variability: 3, breakdownChance: 0.15, operatesWeekend: true, description: "Crushing operation" };
    } else if (equipmentCode.includes('Backfill')) {
      return { baseWorking: 14, variability: 6, breakdownChance: 0.25, operatesWeekend: false, description: "Backfill operation" };
    } else if (equipmentCode.includes('LH')) { // LHD
      return { baseWorking: 16, variability: 6, breakdownChance: 0.3, operatesWeekend: true, description: "Loading and hauling operations" };
    } else if (equipmentCode.includes('DR')) { // Jumbo Drill
      return { baseWorking: 12, variability: 4, breakdownChance: 0.25, operatesWeekend: false, description: "Development drilling operations" };
    } else if (equipmentCode.includes('MT')) { // Mine Truck
      return { baseWorking: 16, variability: 4, breakdownChance: 0.3, operatesWeekend: true, description: "Mine transport operations" };
    } else if (equipmentCode.includes('SC')) { // Shortcrete
      return { baseWorking: 8, variability: 4, breakdownChance: 0.35, operatesWeekend: false, description: "Shortcrete operations" };
    } else if (equipmentCode.includes('MIX')) { // Mixer Truck
      return { baseWorking: 10, variability: 6, breakdownChance: 0.4, operatesWeekend: false, description: "Concrete mixing operations" };
    } else if (equipmentCode.includes('TL')) { // Trolley Locomotive
      return { baseWorking: 14, variability: 4, breakdownChance: 0.25, operatesWeekend: true, description: "Underground transport operations" };
    }
    return { baseWorking: 16, variability: 4, breakdownChance: 0.25, operatesWeekend: true, description: "General operations" }; // Default
  };

  // Generate detailed reports for last 30 days for ALL equipment (untuk data monthly yang lebih baik)
  console.log(`Generating operational reports for ${allActiveEquipment.length} equipment over 30 days...`);
  
  for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
    const reportDate = new Date(today);
    reportDate.setDate(reportDate.getDate() - dayOffset);
    const isWeekend = reportDate.getDay() === 0 || reportDate.getDay() === 6;
    
    // Generate for each equipment (but not all every day to create realistic variety)
    for (const eq of allActiveEquipment) {
      const pattern = getOperationalPattern(eq.code);
      
      // Skip if equipment doesn't operate on weekends and it's weekend
      if (isWeekend && !pattern.operatesWeekend && Math.random() > 0.2) {
        continue;
      }

      // Skip some equipment some days to create realistic operational patterns
      if (Math.random() > 0.85) {
        continue;
      }

      // Get department for this equipment
      const equipmentDept = await getEquipmentDepartment(eq.id);

      const workingHours = Math.max(4, pattern.baseWorking + Math.floor(Math.random() * pattern.variability) - Math.floor(pattern.variability/2));
      const breakdownHours = Math.random() < pattern.breakdownChance ? Math.floor(Math.random() * 3) : 0;
      const standbyHours = Math.max(0, 24 - workingHours - breakdownHours);

      const notes = breakdownHours > 1 ? 
        `Maintenance required - ${eq.name}` : 
        `Normal operation - ${eq.name}`;

      operationalReportsData.push({
        reportDate: reportDate,
        equipmentId: eq.id,
        departmentId: equipmentDept.id,
        createdById: [inputterUser.id, plannerPmtc.id, plannerMmtc.id][Math.floor(Math.random() * 3)],
        totalWorking: workingHours,
        totalStandby: standbyHours,
        totalBreakdown: breakdownHours,
        shiftType: ["Shift 1", "Shift 2", "Shift 3"][Math.floor(Math.random() * 3)],
        isComplete: true,
        notes: notes,
        activities: [
          {
            equipmentId: eq.id,
            startDateTime: createSafeDateTime(reportDate, 6),
            endDateTime: createSafeDateTime(reportDate, 18),
            duration: workingHours,
            maintenanceType: "Operational",
            description: `${pattern.description} - ${eq.name}`,
            object: eq.name,
            status: EquipmentStatus.WORKING,
            createdById: inputterUser.id,
          },
        ],
      });
    }
  }

  let reportsCreated = 0;
  for (const reportData of operationalReportsData) {
    const { activities, ...reportInfo } = reportData;

    const existingReport = await prisma.operationalReport.findUnique({
      where: {
        reportDate_equipmentId: {
          reportDate: reportInfo.reportDate,
          equipmentId: reportInfo.equipmentId,
        },
      },
    });

    if (!existingReport) {
      const report = await prisma.operationalReport.create({
        data: reportInfo,
      });

      // Create activity details
      await Promise.all(
        activities.map((activity) =>
          prisma.activityDetail.create({
            data: {
              operationalReportId: report.id,
              ...activity,
            },
          })
        )
      );
      reportsCreated++;
    }
  }

  console.log(
    `✅ Created ${reportsCreated} operational reports with activities`
  );
}

if (require.main === module) {
  seedOperationalData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
