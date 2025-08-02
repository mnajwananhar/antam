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

  const ballMill1 = equipment.find((eq) => eq.code === "Ball Mill 1")!;
  const lhd003 = equipment.find((eq) => eq.code === "08LH003")!;

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

  // Create sample operational reports with activity details
  console.log("📊 Creating sample operational reports...");

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const operationalReportsData = [
    {
      reportDate: yesterday,
      equipmentId: ballMill1.id,
      departmentId: pmtcDept.id,
      createdById: inputterUser.id,
      totalWorking: 20,
      totalStandby: 2,
      totalBreakdown: 2,
      shiftType: "Shift 1",
      isComplete: true,
      notes: "Operasi normal, ada minor stop untuk adjustment",
      activities: [
        {
          equipmentId: ballMill1.id,
          startDateTime: new Date(
            `${yesterday.toISOString().split("T")[0]}T06:00:00`
          ),
          endDateTime: new Date(
            `${yesterday.toISOString().split("T")[0]}T18:00:00`
          ),
          maintenanceType: "Operational",
          description: "Operasi normal grinding",
          object: "Ball Mill 1",
          status: EquipmentStatus.WORKING,
          createdById: inputterUser.id,
        },
        {
          equipmentId: ballMill1.id,
          startDateTime: new Date(
            `${yesterday.toISOString().split("T")[0]}T18:00:00`
          ),
          endDateTime: new Date(
            `${yesterday.toISOString().split("T")[0]}T20:00:00`
          ),
          maintenanceType: "Adjustment",
          description: "Penyesuaian feed rate",
          object: "Feed System",
          status: EquipmentStatus.STANDBY,
          createdById: inputterUser.id,
        },
        {
          equipmentId: ballMill1.id,
          startDateTime: new Date(
            `${yesterday.toISOString().split("T")[0]}T20:00:00`
          ),
          endDateTime: new Date(
            `${yesterday.toISOString().split("T")[0]}T22:00:00`
          ),
          maintenanceType: "Corrective",
          description: "Penggantian liner yang aus",
          object: "Mill Liner",
          cause: "Keausan normal",
          effect: "Efisiensi grinding menurun",
          status: EquipmentStatus.BREAKDOWN,
          createdById: inputterUser.id,
        },
      ],
    },
    {
      reportDate: yesterday,
      equipmentId: lhd003.id,
      departmentId: mmtcDept.id,
      createdById: inputterUser.id,
      totalWorking: 16,
      totalStandby: 4,
      totalBreakdown: 4,
      shiftType: "Shift 2",
      isComplete: true,
      notes: "Ada trouble pada sistem hidraulik",
      activities: [
        {
          equipmentId: lhd003.id,
          startDateTime: new Date(
            `${yesterday.toISOString().split("T")[0]}T14:00:00`
          ),
          endDateTime: new Date(
            `${yesterday.toISOString().split("T")[0]}T18:00:00`
          ),
          maintenanceType: "Operational",
          description: "Loading dan hauling normal",
          object: "LHD 08LH003",
          status: EquipmentStatus.WORKING,
          createdById: inputterUser.id,
        },
        {
          equipmentId: lhd003.id,
          startDateTime: new Date(
            `${yesterday.toISOString().split("T")[0]}T18:00:00`
          ),
          endDateTime: new Date(
            `${yesterday.toISOString().split("T")[0]}T22:00:00`
          ),
          maintenanceType: "Corrective",
          description: "Perbaikan kebocoran hidraulik",
          object: "Hydraulic System",
          cause: "Seal rusak",
          effect: "Performa bucket menurun",
          status: EquipmentStatus.BREAKDOWN,
          createdById: inputterUser.id,
        },
      ],
    },
  ];

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
