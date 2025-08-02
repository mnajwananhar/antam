import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Data review API called by:", session.user?.username);

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const departmentId = searchParams.get("departmentId");
    const equipmentCategory = searchParams.get("equipmentCategory");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const isComplete = searchParams.get("isComplete");
    const shiftType = searchParams.get("shiftType");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    console.log("Query params:", {
      departmentId,
      equipmentCategory,
      dateFrom,
      dateTo,
      isComplete,
      shiftType,
      page,
      pageSize,
    });

    // Build where clause based on filters
    const where: Record<string, unknown> = {};

    // Apply role-based access control
    if (session.user.role === "PLANNER" && session.user.departmentId) {
      where.departmentId = session.user.departmentId;
    }

    if (departmentId) {
      where.departmentId = parseInt(departmentId);
    }

    if (dateFrom || dateTo) {
      where.reportDate = {};
      const reportDateFilter = where.reportDate as Record<string, Date>;
      if (dateFrom) {
        reportDateFilter.gte = new Date(dateFrom);
      }
      if (dateTo) {
        reportDateFilter.lte = new Date(dateTo);
      }
    }

    if (isComplete && isComplete !== "all") {
      where.isComplete = isComplete === "true";
    }

    if (shiftType) {
      where.shiftType = shiftType;
    }

    console.log("Where clause:", JSON.stringify(where, null, 2));

    // First, let's just try to get some basic data
    const totalRecords = await prisma.operationalReport.count({ where });
    console.log("Total records found:", totalRecords);

    // Get paginated data with simplified relations
    const reports = await prisma.operationalReport.findMany({
      where,
      include: {
        equipment: {
          include: {
            category: true,
          },
        },
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
          select: {
            id: true,
          },
        },
      },
      orderBy: [{ reportDate: "desc" }, { equipment: { name: "asc" } }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    console.log("Reports found:", reports.length);

    // Transform data for frontend
    const transformedData = reports.map((report) => ({
      id: report.id,
      reportDate: report.reportDate.toISOString().split("T")[0],
      equipmentName: report.equipment.name,
      equipmentCode: report.equipment.code,
      departmentName: report.department.name,
      totalWorking: report.totalWorking || 0,
      totalStandby: report.totalStandby || 0,
      totalBreakdown: report.totalBreakdown || 0,
      isComplete: report.isComplete,
      createdBy: report.createdBy?.username || "System",
      lastUpdatedBy:
        report.lastUpdatedBy?.username ||
        report.createdBy?.username ||
        "System",
      lastUpdatedAt: report.updatedAt.toISOString(),
      shiftType: report.shiftType || "shift-1",
      activityCount: report.activityDetails.length,
    }));

    console.log("Transformed data sample:", transformedData[0]);

    return NextResponse.json({
      data: transformedData,
      total: totalRecords,
      page,
      pageSize,
      totalPages: Math.ceil(totalRecords / pageSize),
    });
  } catch (error) {
    console.error("Data review API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
