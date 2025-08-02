import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { category, id } = await params;

    // Only Admin can delete
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only Admin can delete data." },
        { status: 403 }
      );
    }

    const recordId = parseInt(id);

    if (isNaN(recordId)) {
      return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
    }

    console.log(
      `Deleting ${category} record ${recordId} by ${session.user.username}`
    );

    // Delete based on category
    let deletedRecord = null;

    try {
      switch (category) {
        case "operational-reports":
          // First delete related activity details
          await prisma.activityDetail.deleteMany({
            where: { operationalReportId: recordId },
          });
          // Then delete the main operational report
          deletedRecord = await prisma.operationalReport.delete({
            where: { id: recordId },
          });
          break;

        case "kta-tta":
          deletedRecord = await prisma.ktaKpiData.delete({
            where: {
              id: recordId,
              dataType: "KTA_TTA",
            },
          });
          break;

        case "kpi-utama":
          deletedRecord = await prisma.ktaKpiData.delete({
            where: {
              id: recordId,
              dataType: "KPI_UTAMA",
            },
          });
          break;

        case "maintenance-routine":
          // First delete related maintenance activities
          await prisma.maintenanceActivity.deleteMany({
            where: { maintenanceRoutineId: recordId },
          });
          // Then delete the main maintenance routine
          deletedRecord = await prisma.maintenanceRoutine.delete({
            where: { id: recordId },
          });
          break;

        case "critical-issues":
          deletedRecord = await prisma.criticalIssue.delete({
            where: { id: recordId },
          });
          break;

        case "safety-incidents":
          deletedRecord = await prisma.safetyIncident.delete({
            where: { id: recordId },
          });
          break;

        case "energy-targets":
          deletedRecord = await prisma.energyTarget.delete({
            where: { id: recordId },
          });
          break;

        case "energy-consumption":
          deletedRecord = await prisma.energyConsumption.delete({
            where: { id: recordId },
          });
          break;

        default:
          return NextResponse.json(
            { error: "Invalid category" },
            { status: 400 }
          );
      }

      if (!deletedRecord) {
        return NextResponse.json(
          { error: "Record not found" },
          { status: 404 }
        );
      }

      console.log(`Successfully deleted ${category} record ${recordId}`);

      return NextResponse.json({
        success: true,
        message: `${category} record deleted successfully`,
        deletedId: recordId,
      });
    } catch (dbError: unknown) {
      console.error("Database deletion error:", dbError);
      const errorMessage =
        dbError instanceof Error ? dbError.message : "Database error";
      return NextResponse.json(
        { error: `Failed to delete record: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Delete API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
