import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { type, id } = await params;
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "PLANNER", "INPUTTER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const userRole = session.user.role as UserRole;
    const userId = parseInt(session.user.id);

    // For INPUTTER role, create approval request instead of direct update
    if (userRole === "INPUTTER") {
      return await createApprovalRequest(type, parseInt(id), body, userId);
    }

    // For ADMIN and PLANNER, update directly
    return await updateDataDirectly(type, parseInt(id), body);
  } catch (error) {
    console.error("Error in manage data PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { type, id } = await params;
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and PLANNER can delete
    if (!["ADMIN", "PLANNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return await deleteDataDirectly(type, parseInt(id));
  } catch (error) {
    console.error("Error in manage data DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function createApprovalRequest(
  type: string,
  recordId: number,
  newData: Record<string, unknown>,
  requesterId: number
): Promise<NextResponse> {
  try {
    // Get existing data for comparison
    const oldData = await getExistingData(type, recordId);
    if (!oldData) {
      return NextResponse.json({ error: "Data not found" }, { status: 404 });
    }

    // Determine department from data for routing approval
    let departmentId: number | null = null;
    if (type === "operational_report") {
      const report = await prisma.operationalReport.findUnique({
        where: { id: recordId },
        select: { departmentId: true }
      });
      departmentId = report?.departmentId || null;
    } else if (type === "critical_issue") {
      const issue = await prisma.criticalIssue.findUnique({
        where: { id: recordId },
        select: { departmentId: true }
      });
      departmentId = issue?.departmentId || null;
    } else if (type === "maintenance_routine") {
      const routine = await prisma.maintenanceRoutine.findUnique({
        where: { id: recordId },
        select: { departmentId: true }
      });
      departmentId = routine?.departmentId || null;
    }

    // Create approval request
    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        requesterId,
        status: "PENDING",
        requestType: "data_change",
        tableName: getTableName(type),
        recordId,
        oldData: oldData as Prisma.InputJsonValue,
        newData: newData as Prisma.InputJsonValue,
        // Additional metadata for department context
        ...(departmentId && { 
          newData: {
            ...newData,
            _departmentId: departmentId // Add department context for approval routing
          }
        })
      },
    });

    return NextResponse.json({
      message: "Permintaan perubahan data telah diajukan untuk persetujuan",
      approvalRequestId: approvalRequest.id,
    });
  } catch (error) {
    console.error("Error creating approval request:", error);
    return NextResponse.json(
      { error: "Failed to create approval request" },
      { status: 500 }
    );
  }
}

async function updateDataDirectly(
  type: string,
  recordId: number,
  data: Record<string, unknown>
): Promise<NextResponse> {
  try {
    let result;

    switch (type) {
      case "operational_report":
        result = await prisma.operationalReport.update({
          where: { id: recordId },
          data: {
            totalWorking: data.totalWorking as number,
            totalStandby: data.totalStandby as number,
            totalBreakdown: data.totalBreakdown as number,
            shiftType: data.shiftType as string,
            notes: data.notes as string,
            isComplete: data.isComplete as boolean,
            updatedAt: new Date(),
          },
        });
        break;

      case "kta_tta":
        result = await prisma.ktaKpiData.update({
          where: { id: recordId },
          data: {
            namaPelapor: data.namaPelapor as string,
            lokasi: data.lokasi as string,
            keterangan: data.keterangan as string,
            statusTindakLanjut: data.statusTindakLanjut as "OPEN" | "CLOSE",
            picDepartemen: data.picDepartemen as string,
            dueDate: data.dueDate ? new Date(data.dueDate as string) : null,
            tindakLanjutLangsung: data.tindakLanjutLangsung as string,
            updatedAt: new Date(),
          },
        });
        break;

      case "critical_issue":
        result = await prisma.criticalIssue.update({
          where: { id: recordId },
          data: {
            issueName: data.issueName as string,
            status: data.status as "INVESTIGASI" | "PROSES" | "SELESAI",
            description: data.description as string,
            updatedAt: new Date(),
          },
        });
        break;

      case "maintenance_routine":
        result = await prisma.maintenanceRoutine.update({
          where: { id: recordId },
          data: {
            jobName: data.jobName as string,
            startDate: new Date(data.startDate as string),
            endDate: data.endDate ? new Date(data.endDate as string) : null,
            description: data.description as string,
            updatedAt: new Date(),
          },
        });
        break;

      case "safety_incident":
        result = await prisma.safetyIncident.update({
          where: { id: recordId },
          data: {
            nearmiss: data.nearmiss as number,
            kecAlat: data.kecAlat as number,
            kecKecil: data.kecKecil as number,
            kecRingan: data.kecRingan as number,
            kecBerat: data.kecBerat as number,
            fatality: data.fatality as number,
            updatedAt: new Date(),
          },
        });
        break;

      case "energy_realization":
        result = await prisma.energyRealization.update({
          where: { id: recordId },
          data: {
            ikesRealization: data.ikesRealization as number,
            emissionRealization: data.emissionRealization as number,
            updatedAt: new Date(),
          },
        });
        break;

      case "energy_consumption":
        result = await prisma.energyConsumption.update({
          where: { id: recordId },
          data: {
            tambangConsumption: data.tambangConsumption as number,
            pabrikConsumption: data.pabrikConsumption as number,
            supportingConsumption: data.supportingConsumption as number,
            updatedAt: new Date(),
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Unsupported data type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: "Data berhasil diperbarui",
      data: result,
    });
  } catch (error) {
    console.error("Error updating data:", error);
    return NextResponse.json(
      { error: "Failed to update data" },
      { status: 500 }
    );
  }
}

async function deleteDataDirectly(
  type: string,
  recordId: number
): Promise<NextResponse> {
  try {
    switch (type) {
      case "operational_report":
        // Delete related activity details first (cascade should handle this)
        await prisma.operationalReport.delete({
          where: { id: recordId },
        });
        break;

      case "kta_tta":
        await prisma.ktaKpiData.delete({
          where: { id: recordId },
        });
        break;

      case "critical_issue":
        await prisma.criticalIssue.delete({
          where: { id: recordId },
        });
        break;

      case "maintenance_routine":
        // Delete related activities first (cascade should handle this)
        await prisma.maintenanceRoutine.delete({
          where: { id: recordId },
        });
        break;

      case "safety_incident":
        await prisma.safetyIncident.delete({
          where: { id: recordId },
        });
        break;

      case "energy_realization":
        await prisma.energyRealization.delete({
          where: { id: recordId },
        });
        break;

      case "energy_consumption":
        await prisma.energyConsumption.delete({
          where: { id: recordId },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Unsupported data type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: "Data berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting data:", error);
    return NextResponse.json(
      { error: "Failed to delete data" },
      { status: 500 }
    );
  }
}

async function getExistingData(
  type: string,
  recordId: number
): Promise<Record<string, unknown> | null> {
  try {
    switch (type) {
      case "operational_report":
        return await prisma.operationalReport.findUnique({
          where: { id: recordId },
        });

      case "kta_tta":
        return await prisma.ktaKpiData.findUnique({
          where: { id: recordId },
        });

      case "critical_issue":
        return await prisma.criticalIssue.findUnique({
          where: { id: recordId },
        });

      case "maintenance_routine":
        return await prisma.maintenanceRoutine.findUnique({
          where: { id: recordId },
        });

      case "safety_incident":
        return await prisma.safetyIncident.findUnique({
          where: { id: recordId },
        });

      case "energy_realization":
        return await prisma.energyRealization.findUnique({
          where: { id: recordId },
        });

      case "energy_consumption":
        return await prisma.energyConsumption.findUnique({
          where: { id: recordId },
        });

      default:
        return null;
    }
  } catch (error) {
    console.error("Error getting existing data:", error);
    return null;
  }
}

function getTableName(type: string): string {
  const tableMap: Record<string, string> = {
    operational_report: "operational_reports",
    kta_tta: "kta_kpi_data",
    critical_issue: "critical_issues",
    maintenance_routine: "maintenance_routine",
    safety_incident: "safety_incidents",
    energy_realization: "energy_realizations",
    energy_consumption: "energy_consumption",
  };

  return tableMap[type] || type;
}
