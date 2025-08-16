import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  department: z.string(),
  period: z.enum(["daily", "weekly", "monthly", "yearly"]).default("monthly"),
  equipment: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

type PeriodType = "daily" | "weekly" | "monthly" | "yearly";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = querySchema.parse({
      department: searchParams.get("department"),
      period: searchParams.get("period") as PeriodType,
      equipment: searchParams.get("equipment"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    });

    const { department, period, equipment, startDate, endDate } = queryParams;

    // Find department
    const departmentData = await prisma.department.findFirst({
      where: {
        code: department,
      },
    });

    if (!departmentData) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    // Get available years from operational reports
    const availableYearsFromReports = await prisma.operationalReport.findMany({
      where: {
        departmentId: departmentData.id,
      },
      select: {
        reportDate: true,
      },
    });

    const uniqueYears = [
      ...new Set(
        availableYearsFromReports
          .map((item) => new Date(item.reportDate).getFullYear())
      ),
    ].sort((a, b) => b - a); // Sort descending

    // Get available equipment for this department
    // Get available equipment for this department
    const availableEquipment = await prisma.equipment.findMany({
      where: {
        equipmentDepartments: {
          some: {
            departmentId: departmentData.id,
            isActive: true,
          },
        },
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Parse equipment filter
    const equipmentIds = equipment && equipment.trim() !== "" 
      ? equipment.split(",").map(id => parseInt(id)).filter(id => !isNaN(id))
      : [];

    // Calculate date range based on period
    const now = new Date();
    let fromDate: Date;
    const toDate: Date = endDate && endDate.trim() !== "" ? new Date(endDate) : now;

    switch (period) {
      case "daily":
        fromDate = startDate && startDate.trim() !== "" ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        break;
      case "weekly":
        fromDate = startDate && startDate.trim() !== "" ? new Date(startDate) : new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // Last 12 weeks
        break;
      case "monthly":
        fromDate = startDate && startDate.trim() !== "" ? new Date(startDate) : new Date(now.getFullYear() - 1, now.getMonth(), 1); // Last 12 months
        break;
      case "yearly":
        fromDate = startDate && startDate.trim() !== "" ? new Date(startDate) : new Date(now.getFullYear() - 5, 0, 1); // Last 5 years
        break;
    }

    // Build where clause for operational reports
    const whereClause: {
      departmentId: number;
      reportDate: {
        gte: Date;
        lte: Date;
      };
      equipmentId?: {
        in: number[];
      };
    } = {
      departmentId: departmentData.id,
      reportDate: {
        gte: fromDate,
        lte: toDate,
      },
    };

    if (equipmentIds.length > 0) {
      whereClause.equipmentId = {
        in: equipmentIds,
      };
    }

    // Get operational reports
    const operationalReports = await prisma.operationalReport.findMany({
      where: whereClause,
      include: {
        equipment: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        reportDate: "asc",
      },
    });

    // Calculate productivity metrics and group by period
    const productivityData = calculateProductivityMetrics(operationalReports, period);

    // Get equipment status (latest status for each equipment)
    const equipmentStatus = await Promise.all(
      availableEquipment.map(async (eq) => {
        const latestStatus = await prisma.equipmentStatusHistory.findFirst({
          where: {
            equipmentId: eq.id,
          },
          orderBy: {
            changedAt: "desc",
          },
        });

        return {
          id: eq.id,
          equipmentName: eq.name,
          equipmentCode: eq.code,
          status: latestStatus?.status || "WORKING",
          lastUpdated: latestStatus?.changedAt?.toISOString() || new Date().toISOString(),
          category: eq.category.name,
        };
      })
    );

    // Get critical issues for this department (limit to 10 most recent)
    const criticalIssues = await prisma.criticalIssue.findMany({
      where: {
        departmentId: departmentData.id,
      },
      include: {
        department: {
          select: {
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Limit to 10 most recent critical issues
    });

    // Get notification stats
    const notificationStats = await prisma.notification.aggregate({
      where: {
        departmentId: departmentData.id,
      },
      _count: {
        id: true,
      },
    });

    const completedNotifications = await prisma.notification.count({
      where: {
        departmentId: departmentData.id,
        status: "COMPLETE",
      },
    });

    // Get order stats
    const orders = await prisma.order.findMany({
      where: {
        notification: {
          departmentId: departmentData.id,
        },
      },
      include: {
        activities: true,
      },
    });

    const totalActivities = orders.reduce((sum, order) => sum + order.activities.length, 0);
    const completedActivities = orders.reduce(
      (sum, order) => sum + order.activities.filter(activity => activity.isCompleted).length,
      0
    );

    // KTA TTA data (filtered by department's picDepartemen)
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const ktaStartDate = new Date(currentYear, currentMonth - 1, 1);
    const ktaEndDate = new Date(currentYear, currentMonth, 0);
    
    // Map department codes to PIC values that might be in the database
    const departmentPicMappings: Record<string, string[]> = {
      "ECDC": ["ECDC", "Electric Control", "Electrical"],
      "HETU": ["HETU", "Heavy Equipment", "Testing"],
      "MMTC": ["MMTC", "Mine Maintenance"],
      "PMTC": ["PMTC", "Plant Maintenance"],
    };

    const picValues = departmentPicMappings[department] || [department];
    
    const ktaTtaCount = await prisma.ktaKpiData.count({
      where: {
        tanggal: {
          gte: ktaStartDate,
          lte: ktaEndDate,
        },
        picDepartemen: {
          in: picValues,
        },
      },
    });

    return NextResponse.json({
      productivityData,
      criticalIssues: criticalIssues.map((issue) => ({
        id: issue.id,
        issueName: issue.issueName,
        department: issue.department.code,
        status: issue.status,
        description: issue.description,
        createdAt: issue.createdAt.toISOString(),
      })),
      equipmentStatus,
      availableEquipment: availableEquipment.map((eq) => ({
        id: eq.id,
        name: eq.name,
        code: eq.code,
        category: eq.category.name,
      })),
      notifications: {
        total: notificationStats._count.id || 0,
        completed: completedNotifications,
      },
      orders: {
        totalOrders: orders.length,
        totalActivities,
        completedActivities,
      },
      ktaTta: {
        rencana: 186,
        aktual: ktaTtaCount,
      },
      availableYears: uniqueYears,
      monthName: new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(currentYear, currentMonth - 1)),
    });
  } catch (error) {
    console.error("Operational Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculateProductivityMetrics(
  reports: Array<{
    reportDate: Date;
    totalWorking: number;
    totalStandby: number;
    totalBreakdown: number;
    equipment: {
      name: string;
      code: string;
    };
  }>,
  period: PeriodType
): Array<{
  period: string;
  pa: number | null;
  ma: number | null;
  ua: number | null;
  eu: number | null;
}> {
  if (reports.length === 0) {
    return [];
  }

  // Group reports by period
  const groupedData = new Map<string, typeof reports>();

  reports.forEach((report) => {
    let periodKey: string;
    const date = new Date(report.reportDate);

    switch (period) {
      case "daily":
        periodKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
        break;
      case "weekly":
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        periodKey = startOfWeek.toISOString().split("T")[0];
        break;
      case "monthly":
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
      case "yearly":
        periodKey = date.getFullYear().toString();
        break;
    }

    if (!groupedData.has(periodKey)) {
      groupedData.set(periodKey, []);
    }
    groupedData.get(periodKey)!.push(report);
  });

  // Sort the grouped data keys chronologically first
  const sortedKeys = Array.from(groupedData.keys()).sort();

  // Calculate metrics for each period in chronological order
  const result: Array<{
    period: string;
    pa: number | null;
    ma: number | null;
    ua: number | null;
    eu: number | null;
  }> = [];

  sortedKeys.forEach((periodKey) => {
    const periodReports = groupedData.get(periodKey)!;
    
    // Sum all hours for the period
    const totalWorking = periodReports.reduce((sum, r) => sum + r.totalWorking, 0);
    const totalStandby = periodReports.reduce((sum, r) => sum + r.totalStandby, 0);
    const totalBreakdown = periodReports.reduce((sum, r) => sum + r.totalBreakdown, 0);

    const totalHours = totalWorking + totalStandby + totalBreakdown;

    if (totalHours === 0) {
      result.push({
        period: formatPeriodLabel(periodKey, period),
        pa: null,
        ma: null,
        ua: null,
        eu: null,
      });
      return;
    }

    // Calculate metrics based on formulas from the article
    const pa = ((totalWorking + totalBreakdown) / totalHours) * 100; // Physical Availability
    const ma = ((totalWorking + totalStandby) / totalHours) * 100; // Mechanical Availability
    const ua = totalWorking + totalStandby > 0 ? (totalWorking / (totalWorking + totalStandby)) * 100 : 0; // Use of Availability
    const eu = (totalWorking / totalHours) * 100; // Effective Utilization

    result.push({
      period: formatPeriodLabel(periodKey, period),
      pa: Math.round(pa * 100) / 100,
      ma: Math.round(ma * 100) / 100,
      ua: Math.round(ua * 100) / 100,
      eu: Math.round(eu * 100) / 100,
    });
  });

  return result;
}


function formatPeriodLabel(periodKey: string, period: PeriodType): string {
  switch (period) {
    case "daily":
      return new Date(periodKey).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      });
    case "weekly":
      return `Week ${periodKey}`;
    case "monthly":
      const [year, month] = periodKey.split("-");
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("id-ID", {
        month: "short",
        year: "numeric",
      });
    case "yearly":
      return periodKey;
    default:
      return periodKey;
  }
}
