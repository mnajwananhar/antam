import { PrismaClient, ApprovalStatus, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedApprovalRequests() {
  console.log("🌱 Seeding Approval Requests...");

  // Get required references
  const users = await prisma.user.findMany();
  const equipment = await prisma.equipment.findMany();

  const inputterUser = users.find((u) => u.username === "inputter_shift1")!;
  const plannerMmtc = users.find((u) => u.username === "planner_mmtc")!;
  const plannerPmtc = users.find((u) => u.username === "planner_pmtc")!;
  const adminUser = users.find((u) => u.username === "admin")!;

  const ballMill1 = equipment.find((eq) => eq.code === "Ball Mill 1")!;

  // Create sample approval requests
  const sampleApprovalRequests = [
    {
      requesterId: inputterUser.id,
      approverId: plannerMmtc.id,
      status: ApprovalStatus.PENDING,
      requestType: "data_change",
      tableName: "operational_reports",
      recordId: 1, // This would be actual record ID in real scenario
      oldData: {
        totalWorking: 18,
        totalStandby: 4,
        totalBreakdown: 2,
        notes: "Operasi normal",
      },
      newData: {
        totalWorking: 20,
        totalStandby: 2,
        totalBreakdown: 2,
        notes: "Operasi normal, ada minor stop untuk adjustment",
      },
      reason: "Koreksi data jam operasi berdasarkan laporan shift terbaru",
    },
    {
      requesterId: inputterUser.id,
      approverId: plannerPmtc.id,
      status: ApprovalStatus.APPROVED,
      requestType: "equipment_status_change",
      tableName: "equipment_status_history",
      recordId: ballMill1.id,
      oldData: {
        status: "WORKING",
      },
      newData: {
        status: "BREAKDOWN",
      },
      reason: "Ball Mill 1 mengalami kerusakan bearing",
      approvedAt: new Date("2025-07-30T10:30:00Z"),
    },
    {
      requesterId: plannerMmtc.id,
      approverId: adminUser.id,
      status: ApprovalStatus.PENDING_ADMIN_APPROVAL,
      requestType: "maintenance_schedule_change",
      tableName: "maintenance_routine",
      recordId: null,
      oldData: Prisma.JsonNull,
      newData: {
        jobName: "Emergency Maintenance - LHD Fleet",
        startDate: "2025-08-01",
        endDate: "2025-08-03",
        description:
          "Maintenance darurat untuk semua unit LHD karena masalah hydraulic system",
      },
      reason:
        "Diperlukan maintenance darurat untuk mencegah kerusakan lebih lanjut",
    },
    {
      requesterId: inputterUser.id,
      approverId: plannerPmtc.id,
      status: ApprovalStatus.REJECTED,
      requestType: "data_deletion",
      tableName: "kta_kpi_data",
      recordId: null,
      oldData: {
        noRegister: "KTA-PMTC-2025-999",
        keterangan: "Data entry error",
      },
      newData: Prisma.JsonNull,
      reason: "Kesalahan input data, mohon dihapus",
      approvedAt: new Date("2025-07-29T14:15:00Z"),
    },
  ];

  for (const requestData of sampleApprovalRequests) {
    const existingRequest = await prisma.approvalRequest.findFirst({
      where: {
        requesterId: requestData.requesterId,
        requestType: requestData.requestType,
        tableName: requestData.tableName,
        recordId: requestData.recordId,
      },
    });

    if (!existingRequest) {
      await prisma.approvalRequest.create({
        data: requestData,
      });
    }
  }

  console.log(`✅ Created ${sampleApprovalRequests.length} approval requests`);
}

if (require.main === module) {
  seedApprovalRequests()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
