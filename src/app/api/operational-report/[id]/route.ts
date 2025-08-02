import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Type definitions for activity detail
interface ActivityDetailInput {
  startDateTime: string;
  endDateTime: string;
  status: string;
  maintenanceType?: string | null;
  description?: string | null;
  object?: string | null;
  cause?: string | null;
  effect?: string | null;
}

// GET: Load specific operational report by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const recordId = parseInt(id);
    if (isNaN(recordId)) {
      return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
    }

    console.log(
      `Loading operational report ID: ${recordId} for user: ${session.user.username}`
    );

    const report = await prisma.operationalReport.findUnique({
      where: { id: recordId },
      include: {
        equipment: {
          include: {
            category: true,
          },
        },
        department: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        lastUpdatedBy: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        activityDetails: {
          include: {
            createdBy: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
          orderBy: [{ status: "asc" }, { startDateTime: "asc" }],
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Operational report not found" },
        { status: 404 }
      );
    }

    // Check access permissions
    const hasAccess =
      session.user.role === "ADMIN" ||
      session.user.role === "INPUTTER" ||
      (session.user.role === "PLANNER" &&
        session.user.departmentId === report.departmentId);

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.log(
      `Successfully loaded operational report: ${report.equipment.name} - ${report.reportDate}`
    );

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("GET operational report error:", error);
    console.error("Error details:", {
      error: error instanceof Error ? error.message : error,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update existing operational report
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const recordId = parseInt(id);

    if (isNaN(recordId)) {
      return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
    }

    const body = await request.json();
    const {
      reportDate,
      equipmentId,
      departmentId,
      totalWorking,
      totalStandby,
      totalBreakdown,
      activityDetails = [],
    } = body;

    // Validate required fields
    if (!reportDate || !equipmentId || !departmentId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: reportDate, equipmentId, departmentId",
        },
        { status: 400 }
      );
    }

    // Parse numeric values
    const totalWorkingInt = parseInt(totalWorking) || 0;
    const totalStandbyInt = parseInt(totalStandby) || 0;
    const totalBreakdownInt = parseInt(totalBreakdown) || 0;

    // Validate total hours (should not exceed 12 hours per day)
    const totalHours = totalWorkingInt + totalStandbyInt + totalBreakdownInt;
    if (totalHours > 12) {
      return NextResponse.json(
        {
          error: "Total hours cannot exceed 12 hours per day",
        },
        { status: 400 }
      );
    }

    // Start transaction
    const updatedReport = await prisma.$transaction(async (tx) => {
      // Update main operational report
      await tx.operationalReport.update({
        where: { id: recordId },
        data: {
          reportDate: new Date(reportDate),
          equipmentId: parseInt(equipmentId),
          departmentId: parseInt(departmentId),
          totalWorking: totalWorkingInt,
          totalStandby: totalStandbyInt,
          totalBreakdown: totalBreakdownInt,
          lastUpdatedById: parseInt(session.user.id),
        },
      });

      // Delete existing activity details
      await tx.activityDetail.deleteMany({
        where: { operationalReportId: recordId },
      });

      // Insert new activity details if provided
      if (activityDetails.length > 0) {
        const validDetails = activityDetails.filter(
          (detail: ActivityDetailInput) =>
            detail.startDateTime && detail.endDateTime && detail.status
        );

        if (validDetails.length > 0) {
          await tx.activityDetail.createMany({
            data: validDetails.map((detail: ActivityDetailInput) => ({
              operationalReportId: recordId,
              equipmentId: parseInt(equipmentId),
              startDateTime: new Date(detail.startDateTime),
              endDateTime: new Date(detail.endDateTime),
              status: detail.status,
              maintenanceType: detail.maintenanceType || null,
              description: detail.description || null,
              object: detail.object || null,
              cause: detail.cause || null,
              effect: detail.effect || null,
              createdById: parseInt(session.user.id),
            })),
          });
        }
      }

      // Return updated report with activity details
      const updatedReport = await tx.operationalReport.findUnique({
        where: { id: recordId },
        include: {
          equipment: {
            include: {
              category: true,
            },
          },
          department: true,
          createdBy: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
          lastUpdatedBy: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
          activityDetails: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  username: true,
                  role: true,
                },
              },
            },
            orderBy: [{ status: "asc" }, { startDateTime: "asc" }],
          },
        },
      });

      return updatedReport;
    });

    console.log(
      `Successfully updated operational report: ${updatedReport?.equipment.name} - ${updatedReport?.reportDate}`
    );

    return NextResponse.json({
      success: true,
      message: `Operational report updated successfully`,
      report: updatedReport,
    });
  } catch (error) {
    console.error("PUT operational report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete operational report (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin can delete
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only Admin can delete reports." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const recordId = parseInt(id);
    if (isNaN(recordId)) {
      return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
    }

    console.log(
      `Deleting operational report ID: ${recordId} by Admin: ${session.user.username}`
    );

    // Check if report exists
    const existingReport = await prisma.operationalReport.findUnique({
      where: { id: recordId },
      select: {
        id: true,
        equipment: { select: { name: true } },
        reportDate: true,
      },
    });

    if (!existingReport) {
      return NextResponse.json(
        { error: "Operational report not found" },
        { status: 404 }
      );
    }

    // Delete in transaction
    await prisma.$transaction(async (tx) => {
      // Delete activity details first (cascade should handle this automatically)
      await tx.activityDetail.deleteMany({
        where: { operationalReportId: recordId },
      });

      // Delete main report
      await tx.operationalReport.delete({
        where: { id: recordId },
      });
    });

    console.log(
      `Successfully deleted operational report: ${existingReport.equipment.name} - ${existingReport.reportDate}`
    );

    return NextResponse.json({
      success: true,
      message: "Operational report deleted successfully",
      deletedId: recordId,
    });
  } catch (error) {
    console.error("DELETE operational report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
