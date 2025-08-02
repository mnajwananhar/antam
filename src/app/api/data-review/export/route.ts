import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exportFormat = searchParams.get("export") || "excel";

    // Build where clause (same as data-review route)
    const where: Record<string, unknown> = {};

    // Apply role-based access control
    if (session.user.role === "PLANNER" && session.user.departmentId) {
      where.equipment = {
        departmentId: session.user.departmentId,
      };
    }

    // Apply filters (same as main data-review route)
    const departmentId = searchParams.get("departmentId");
    const equipmentCategory = searchParams.get("equipmentCategory");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const isComplete = searchParams.get("isComplete");
    const shiftType = searchParams.get("shiftType");

    // Handle equipment filters
    const equipmentFilter: Record<string, unknown> = {};

    if (departmentId) {
      equipmentFilter.departmentId = parseInt(departmentId);
    }

    if (equipmentCategory) {
      equipmentFilter.name = {
        contains: equipmentCategory,
        mode: "insensitive",
      };
    }

    if (Object.keys(equipmentFilter).length > 0) {
      where.equipment = equipmentFilter;
    }

    // Handle date filters
    if (dateFrom || dateTo) {
      const reportDateFilter: Record<string, Date> = {};
      if (dateFrom) {
        reportDateFilter.gte = new Date(dateFrom);
      }
      if (dateTo) {
        reportDateFilter.lte = new Date(dateTo);
      }
      where.reportDate = reportDateFilter;
    }

    if (isComplete && isComplete !== "all") {
      where.isComplete = isComplete === "true";
    }

    if (shiftType) {
      where.shiftType = shiftType;
    }

    // Get all data for export (no pagination)
    const reports = await prisma.operationalReport.findMany({
      where,
      include: {
        equipment: true,
        department: true,
        createdBy: {
          select: {
            username: true,
          },
        },
        lastUpdatedBy: {
          select: {
            username: true,
          },
        },
        activityDetails: {
          include: {
            createdBy: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: [{ reportDate: "desc" }, { equipment: { name: "asc" } }],
    });

    // Transform data for export
    const exportData = reports.map((report) => ({
      "Tanggal Laporan": report.reportDate.toISOString().split("T")[0],
      "Nama Alat": report.equipment.name,
      "Kode Alat": report.equipment.code,
      Departemen: report.department.name,
      Shift: report.shiftType || "shift-1",
      "Jam Working": report.totalWorking || 0,
      "Jam Standby": report.totalStandby || 0,
      "Jam Breakdown": report.totalBreakdown || 0,
      "Total Jam":
        (report.totalWorking || 0) +
        (report.totalStandby || 0) +
        (report.totalBreakdown || 0),
      Status: report.isComplete ? "Complete" : "Draft",
      "Jumlah Aktivitas": 0, // Simplified since activityDetails might not be included
      "Dibuat Oleh": report.createdBy?.username || "System",
      "Diupdate Oleh":
        report.lastUpdatedBy?.username ||
        report.createdBy?.username ||
        "System",
      "Terakhir Update": report.updatedAt
        .toISOString()
        .replace("T", " ")
        .split(".")[0],
    }));

    if (exportFormat === "csv") {
      // Generate CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) =>
          headers
            .map(
              (header) =>
                `"${String(row[header as keyof typeof row] || "").replace(
                  /"/g,
                  '""'
                )}"`
            )
            .join(",")
        ),
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="operational-data-${
            new Date().toISOString().split("T")[0]
          }.csv"`,
        },
      });
    } else {
      // For Excel export, we'll return JSON that frontend can process
      // In a real implementation, you would use a library like xlsx or exceljs
      return NextResponse.json({
        data: exportData,
        filename: `operational-data-${
          new Date().toISOString().split("T")[0]
        }.xlsx`,
      });
    }
  } catch (error) {
    console.error("Export API error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
