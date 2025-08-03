import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Add caching to prevent unnecessary database hits
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    // Create cache key based on user and request params
    const cacheKey = `${category}-${page}-${pageSize}-${session.user.id}-${session.user.role}-${session.user.departmentId}`;

    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      console.log(`Returning cached data for: ${category}, page: ${page}`);
      return NextResponse.json(cachedData.result);
    }

    console.log(
      `Loading fresh data for category: ${category}, page: ${page}, pageSize: ${pageSize}`
    );

    let data = [];
    let total = 0;

    // Apply role-based access control
    const userFilter: Record<string, unknown> = {};
    if (session.user.role === "PLANNER" && session.user.departmentId) {
      userFilter.departmentId = session.user.departmentId;
    }

    const skip = (page - 1) * pageSize;

    try {
      switch (category) {
        case "operational-reports":
          total = await prisma.operationalReport.count({ where: userFilter });
          const reports = await prisma.operationalReport.findMany({
            where: userFilter,
            include: {
              equipment: {
                select: {
                  name: true,
                  code: true,
                },
              },
              department: {
                select: {
                  name: true,
                },
              },
              createdBy: {
                select: {
                  username: true,
                },
              },
            },
            orderBy: { reportDate: "desc" },
            skip,
            take: pageSize,
          });

          data = reports.map((report) => ({
            id: report.id,
            reportDate: report.reportDate,
            equipmentName: report.equipment.name,
            equipmentCode: report.equipment.code,
            departmentId: report.departmentId,
            departmentName: report.department.name,
            totalWorking: report.totalWorking,
            totalStandby: report.totalStandby,
            totalBreakdown: report.totalBreakdown,
            isComplete: report.isComplete,
            shiftType: report.shiftType,
            createdBy: report.createdBy?.username,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
          }));
          break;

        case "kta-tta":
          const ktaFilter = {
            dataType: "KTA_TTA" as const,
            ...(session.user.role === "PLANNER" && session.user.departmentName
              ? {
                  picDepartemen: session.user.departmentName,
                }
              : {}),
          };
          total = await prisma.ktaKpiData.count({ where: ktaFilter });
          const ktaData = await prisma.ktaKpiData.findMany({
            where: ktaFilter,
            include: {
              createdBy: {
                select: {
                  username: true,
                },
              },
            },
            orderBy: { tanggal: "desc" },
            skip,
            take: pageSize,
          });

          data = ktaData.map((item) => ({
            id: item.id,
            tanggal: item.tanggal,
            noRegister: item.noRegister,
            keterangan: item.keterangan,
            namaPelapor: item.namaPelapor,
            nppPelapor: item.nppPelapor,
            picDepartemen: item.picDepartemen,
            departmentName: item.picDepartemen || "N/A",
            statusTindakLanjut: item.statusTindakLanjut,
            lokasi: item.lokasi,
            createdBy: item.createdBy?.username,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }));
          break;

        case "kpi-utama":
          // Only accessible by Admin, Inputter, or MTC&ENG Bureau
          if (
            !(
              session.user.role === "ADMIN" ||
              session.user.role === "INPUTTER" ||
              session.user.departmentName === "MTC&ENG Bureau"
            )
          ) {
            return NextResponse.json(
              { error: "Access denied" },
              { status: 403 }
            );
          }

          const kpiFilter = { dataType: "KPI_UTAMA" as const };
          total = await prisma.ktaKpiData.count({ where: kpiFilter });
          const kpiData = await prisma.ktaKpiData.findMany({
            where: kpiFilter,
            include: {
              createdBy: {
                select: {
                  username: true,
                },
              },
            },
            orderBy: { tanggal: "desc" },
            skip,
            take: pageSize,
          });

          data = kpiData.map((item) => ({
            id: item.id,
            tanggal: item.tanggal,
            noRegister: item.noRegister,
            keterangan: item.keterangan,
            namaPelapor: item.namaPelapor,
            nppPelapor: item.nppPelapor,
            picDepartemen: item.picDepartemen,
            departmentName: item.picDepartemen || "N/A",
            statusTindakLanjut: item.statusTindakLanjut,
            lokasi: item.lokasi,
            createdBy: item.createdBy?.username,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }));
          break;

        case "maintenance-routine":
          total = await prisma.maintenanceRoutine.count({ where: userFilter });
          const maintenanceData = await prisma.maintenanceRoutine.findMany({
            where: userFilter,
            include: {
              department: {
                select: {
                  name: true,
                },
              },
              createdBy: {
                select: {
                  username: true,
                },
              },
            },
            orderBy: { startDate: "desc" },
            skip,
            take: pageSize,
          });

          data = maintenanceData.map((item) => ({
            id: item.id,
            uniqueNumber: item.uniqueNumber,
            jobName: item.jobName,
            startDate: item.startDate,
            endDate: item.endDate,
            description: item.description,
            type: item.type,
            departmentId: item.departmentId,
            departmentName: item.department.name,
            createdBy: item.createdBy?.username,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }));
          break;

        case "critical-issues":
          total = await prisma.criticalIssue.count({ where: userFilter });
          const criticalData = await prisma.criticalIssue.findMany({
            where: userFilter,
            include: {
              department: {
                select: {
                  name: true,
                },
              },
              createdBy: {
                select: {
                  username: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: pageSize,
          });

          data = criticalData.map((item) => ({
            id: item.id,
            issueName: item.issueName,
            description: item.description,
            status: item.status,
            departmentId: item.departmentId,
            departmentName: item.department.name,
            createdBy: item.createdBy?.username,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }));
          break;

        case "safety-incidents":
          // Only accessible by Admin, Inputter, or MTC&ENG Bureau
          if (
            !(
              session.user.role === "ADMIN" ||
              session.user.role === "INPUTTER" ||
              session.user.departmentName === "MTC&ENG Bureau"
            )
          ) {
            return NextResponse.json(
              { error: "Access denied" },
              { status: 403 }
            );
          }

          total = await prisma.safetyIncident.count();
          const safetyData = await prisma.safetyIncident.findMany({
            orderBy: [{ year: "desc" }, { month: "desc" }],
            skip,
            take: pageSize,
          });

          data = safetyData.map((item) => ({
            id: item.id,
            month: item.month,
            year: item.year,
            nearmiss: item.nearmiss,
            kecAlat: item.kecAlat,
            kecKecil: item.kecKecil,
            kecRingan: item.kecRingan,
            kecBerat: item.kecBerat,
            fatality: item.fatality,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }));
          break;

        case "energy-targets":
          // Only accessible by Admin, Inputter, or MTC&ENG Bureau
          if (
            !(
              session.user.role === "ADMIN" ||
              session.user.role === "INPUTTER" ||
              session.user.departmentName === "MTC&ENG Bureau"
            )
          ) {
            return NextResponse.json(
              { error: "Access denied" },
              { status: 403 }
            );
          }

          total = await prisma.energyTarget.count();
          const energyTargetData = await prisma.energyTarget.findMany({
            orderBy: [{ year: "desc" }, { month: "desc" }],
            skip,
            take: pageSize,
          });

          data = energyTargetData.map((item) => ({
            id: item.id,
            month: item.month,
            year: item.year,
            ikesTarget: item.ikesTarget,
            emissionTarget: item.emissionTarget,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }));
          break;

        case "energy-consumption":
          // Only accessible by Admin, Inputter, or MTC&ENG Bureau
          if (
            !(
              session.user.role === "ADMIN" ||
              session.user.role === "INPUTTER" ||
              session.user.departmentName === "MTC&ENG Bureau"
            )
          ) {
            return NextResponse.json(
              { error: "Access denied" },
              { status: 403 }
            );
          }

          total = await prisma.energyConsumption.count();
          const energyConsumptionData = await prisma.energyConsumption.findMany(
            {
              orderBy: [{ year: "desc" }, { month: "desc" }],
              skip,
              take: pageSize,
            }
          );

          data = energyConsumptionData.map((item) => ({
            id: item.id,
            month: item.month,
            year: item.year,
            plnConsumption: item.plnConsumption,
            tambangConsumption: item.tambangConsumption,
            pabrikConsumption: item.pabrikConsumption,
            supportingConsumption: item.supportingConsumption,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }));
          break;

        default:
          return NextResponse.json(
            { error: "Invalid category" },
            { status: 400 }
          );
      }
    } catch (dbError) {
      console.error(`Database error for category ${category}:`, dbError);
      const errorMessage =
        dbError instanceof Error ? dbError.message : "Database error";
      return NextResponse.json(
        {
          error: `Failed to load ${category} data`,
          details: errorMessage,
        },
        { status: 500 }
      );
    }

    console.log(`Successfully loaded ${data.length} records for ${category}`);

    const result = {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      category,
    };

    // Cache the result
    cache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    if (cache.size > 100) {
      const now = Date.now();
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_TTL * 2) {
          cache.delete(key);
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Category API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
