import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// Types for different data sources
interface ManageDataItem {
  id: number;
  type: string;
  title: string;
  department: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status?: string;
  canEdit: boolean;
  canDelete: boolean;
  data: Record<string, unknown>;
}

interface ManageDataResponse {
  data: ManageDataItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    types: Array<{ value: string; label: string; count: number }>;
    departments: Array<{ value: string; label: string; count: number }>;
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "PLANNER", "INPUTTER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const type = searchParams.get("type");
    const department = searchParams.get("department");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const offset = (page - 1) * pageSize;
    const userRole = session.user.role as UserRole;
    const userDepartmentId = session.user.departmentId;

    // Department filter for non-admin users
    let departmentFilter = {};
    if (userRole === "PLANNER" && userDepartmentId) {
      departmentFilter = { departmentId: userDepartmentId };
    }

    const results: ManageDataItem[] = [];

    // Fetch different types of data based on user permissions
    
    // 1. Operational Reports (Aktivitas Harian)
    if (!type || type === "operational_report") {
      const operationalReports = await prisma.operationalReport.findMany({
        where: {
          ...departmentFilter,
          ...(department && { department: { code: department } }),
          ...(search && {
            OR: [
              { equipment: { name: { contains: search, mode: "insensitive" } } },
              { equipment: { code: { contains: search, mode: "insensitive" } } },
              { notes: { contains: search, mode: "insensitive" } },
            ],
          }),
          ...(startDate && { reportDate: { gte: new Date(startDate) } }),
          ...(endDate && { reportDate: { lte: new Date(endDate) } }),
        },
        include: {
          equipment: true,
          department: true,
          createdBy: true,
          activityDetails: true,
        },
        orderBy: { updatedAt: "desc" },
        take: pageSize,
        skip: offset,
      });

      operationalReports.forEach((report) => {
        results.push({
          id: report.id,
          type: "operational_report",
          title: `${report.equipment.name} - ${report.reportDate.toLocaleDateString()}`,
          department: report.department.code,
          createdAt: report.createdAt.toISOString(),
          updatedAt: report.updatedAt.toISOString(),
          createdBy: report.createdBy.username,
          status: report.isComplete ? "Complete" : "Draft",
          canEdit: userRole === "ADMIN" || userRole === "PLANNER" || userRole === "INPUTTER",
          canDelete: userRole === "ADMIN" || userRole === "PLANNER",
          data: {
            reportDate: report.reportDate,
            equipmentId: report.equipmentId,
            equipmentName: report.equipment.name,
            totalWorking: report.totalWorking,
            totalStandby: report.totalStandby,
            totalBreakdown: report.totalBreakdown,
            shiftType: report.shiftType,
            notes: report.notes,
            activityCount: report.activityDetails.length,
          },
        });
      });
    }

    // 2. KTA & TTA Data
    if (!type || type === "kta_tta") {
      const ktaTtaData = await prisma.ktaKpiData.findMany({
        where: {
          ...(userRole === "PLANNER" && userDepartmentId && {
            // Filter based on department relation for planners
            picMapping: {
              departmentId: userDepartmentId
            }
          }),
          ...(department && { 
            picMapping: {
              department: {
                code: department
              }
            }
          }),
          ...(search && {
            OR: [
              { noRegister: { contains: search, mode: "insensitive" } },
              { namaPelapor: { contains: search, mode: "insensitive" } },
              { lokasi: { contains: search, mode: "insensitive" } },
              { keterangan: { contains: search, mode: "insensitive" } },
            ],
          }),
          ...(startDate && { tanggal: { gte: new Date(startDate) } }),
          ...(endDate && { tanggal: { lte: new Date(endDate) } }),
        },
        include: {
          createdBy: true,
          picMapping: {
            include: {
              department: true
            }
          }
        },
        orderBy: { updatedAt: "desc" },
        take: pageSize,
        skip: offset,
      });

      ktaTtaData.forEach((item) => {
        results.push({
          id: item.id,
          type: "kta_tta",
          title: `${item.noRegister} - ${item.namaPelapor || "N/A"}`,
          department: item.picMapping?.department?.code || "N/A",
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
          createdBy: item.createdBy.username,
          status: item.statusTindakLanjut || "N/A",
          canEdit: userRole === "ADMIN" || userRole === "PLANNER" || userRole === "INPUTTER",
          canDelete: userRole === "ADMIN" || userRole === "PLANNER",
          data: {
            noRegister: item.noRegister,
            namaPelapor: item.namaPelapor,
            tanggal: item.tanggal,
            lokasi: item.lokasi,
            picDepartemen: item.picDepartemen,
            statusTindakLanjut: item.statusTindakLanjut,
            keterangan: item.keterangan,
          },
        });
      });
    }

    // 3. Critical Issues
    if (!type || type === "critical_issue") {
      const criticalIssues = await prisma.criticalIssue.findMany({
        where: {
          ...departmentFilter,
          ...(department && { department: { code: department } }),
          ...(search && {
            OR: [
              { issueName: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }),
          ...(startDate && { createdAt: { gte: new Date(startDate) } }),
          ...(endDate && { createdAt: { lte: new Date(endDate) } }),
        },
        include: {
          department: true,
          createdBy: true,
        },
        orderBy: { updatedAt: "desc" },
        take: pageSize,
        skip: offset,
      });

      criticalIssues.forEach((issue) => {
        results.push({
          id: issue.id,
          type: "critical_issue",
          title: issue.issueName,
          department: issue.department.code,
          createdAt: issue.createdAt.toISOString(),
          updatedAt: issue.updatedAt.toISOString(),
          createdBy: issue.createdBy.username,
          status: issue.status,
          canEdit: userRole === "ADMIN" || userRole === "PLANNER" || userRole === "INPUTTER",
          canDelete: userRole === "ADMIN" || userRole === "PLANNER",
          data: {
            issueName: issue.issueName,
            status: issue.status,
            description: issue.description,
          },
        });
      });
    }

    // 4. Maintenance Routine (Planner & Admin only)
    if ((!type || type === "maintenance_routine") && (userRole === "ADMIN" || userRole === "PLANNER")) {
      const maintenanceRoutines = await prisma.maintenanceRoutine.findMany({
        where: {
          ...departmentFilter,
          ...(department && { department: { code: department } }),
          ...(search && {
            OR: [
              { jobName: { contains: search, mode: "insensitive" } },
              { uniqueNumber: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }),
          ...(startDate && { startDate: { gte: new Date(startDate) } }),
          ...(endDate && { endDate: { lte: new Date(endDate) } }),
        },
        include: {
          department: true,
          createdBy: true,
          activities: true,
        },
        orderBy: { updatedAt: "desc" },
        take: pageSize,
        skip: offset,
      });

      maintenanceRoutines.forEach((routine) => {
        results.push({
          id: routine.id,
          type: "maintenance_routine",
          title: `${routine.uniqueNumber} - ${routine.jobName}`,
          department: routine.department.code,
          createdAt: routine.createdAt.toISOString(),
          updatedAt: routine.updatedAt.toISOString(),
          createdBy: routine.createdBy.username,
          status: routine.type,
          canEdit: true,
          canDelete: true,
          data: {
            uniqueNumber: routine.uniqueNumber,
            jobName: routine.jobName,
            startDate: routine.startDate,
            endDate: routine.endDate,
            description: routine.description,
            type: routine.type,
            activitiesCount: routine.activities.length,
          },
        });
      });
    }

    // 5. Safety Incidents (MTC&ENG Bureau only)
    if ((!type || type === "safety_incident") && 
        (userRole === "ADMIN" || (userRole === "PLANNER" && session.user.departmentName === "MTC&ENG Bureau"))) {
      const safetyIncidents = await prisma.safetyIncident.findMany({
        where: {
          ...(search && {
            OR: [
              { month: { equals: parseInt(search) || undefined } },
              { year: { equals: parseInt(search) || undefined } },
            ],
          }),
          ...(startDate && { 
            createdAt: { gte: new Date(startDate) }
          }),
          ...(endDate && { 
            createdAt: { lte: new Date(endDate) }
          }),
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: pageSize,
        skip: offset,
      });

      safetyIncidents.forEach((incident) => {
        results.push({
          id: incident.id,
          type: "safety_incident",
          title: `Insiden ${incident.month}/${incident.year}`,
          department: "MTCENG",
          createdAt: incident.createdAt.toISOString(),
          updatedAt: incident.updatedAt.toISOString(),
          createdBy: "System",
          status: "Active",
          canEdit: true,
          canDelete: true,
          data: {
            month: incident.month,
            year: incident.year,
            nearmiss: incident.nearmiss,
            kecAlat: incident.kecAlat,
            kecKecil: incident.kecKecil,
            kecRingan: incident.kecRingan,
            kecBerat: incident.kecBerat,
            fatality: incident.fatality,
          },
        });
      });
    }

    // 6. Energy Data (MTC&ENG Bureau only)
    if ((!type || type === "energy_realization") && 
        (userRole === "ADMIN" || (userRole === "PLANNER" && session.user.departmentName === "MTC&ENG Bureau"))) {
      const energyRealizations = await prisma.energyRealization.findMany({
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: pageSize,
        skip: offset,
      });

      energyRealizations.forEach((realization) => {
        results.push({
          id: realization.id,
          type: "energy_realization",
          title: `IKES & Emisi ${realization.month}/${realization.year}`,
          department: "MTCENG",
          createdAt: realization.createdAt.toISOString(),
          updatedAt: realization.updatedAt.toISOString(),
          createdBy: "System",
          status: "Active",
          canEdit: true,
          canDelete: true,
          data: {
            month: realization.month,
            year: realization.year,
            ikesRealization: realization.ikesRealization,
            emissionRealization: realization.emissionRealization,
          },
        });
      });
    }

    if ((!type || type === "energy_consumption") && 
        (userRole === "ADMIN" || (userRole === "PLANNER" && session.user.departmentName === "MTC&ENG Bureau"))) {
      const energyConsumptions = await prisma.energyConsumption.findMany({
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: pageSize,
        skip: offset,
      });

      energyConsumptions.forEach((consumption) => {
        results.push({
          id: consumption.id,
          type: "energy_consumption",
          title: `Konsumsi Energi ${consumption.month}/${consumption.year}`,
          department: "MTCENG",
          createdAt: consumption.createdAt.toISOString(),
          updatedAt: consumption.updatedAt.toISOString(),
          createdBy: "System",
          status: "Active",
          canEdit: true,
          canDelete: true,
          data: {
            month: consumption.month,
            year: consumption.year,
            tambangConsumption: consumption.tambangConsumption,
            pabrikConsumption: consumption.pabrikConsumption,
            supportingConsumption: consumption.supportingConsumption,
          },
        });
      });
    }

    // Sort results by updatedAt descending
    results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Get pagination info
    const total = results.length;
    const totalPages = Math.ceil(total / pageSize);

    // Get filter options
    const typeFilters = [
      { value: "operational_report", label: "Aktivitas Harian", count: 0 },
      { value: "kta_tta", label: "KTA & TTA", count: 0 },
      { value: "critical_issue", label: "Critical Issue", count: 0 },
      ...(userRole === "ADMIN" || userRole === "PLANNER" ? [
        { value: "maintenance_routine", label: "Maintenance Rutin", count: 0 }
      ] : []),
      ...(userRole === "ADMIN" || (userRole === "PLANNER" && session.user.departmentName === "MTC&ENG Bureau") ? [
        { value: "safety_incident", label: "Insiden Keselamatan", count: 0 },
        { value: "energy_realization", label: "IKES & Emisi", count: 0 },
        { value: "energy_consumption", label: "Konsumsi Energi", count: 0 },
      ] : []),
    ];

    // Count data for each type
    for (const filter of typeFilters) {
      filter.count = results.filter(item => item.type === filter.value).length;
    }

    const departmentFilters = [
      ...new Set(results.map(item => item.department))
    ].map(dept => ({
      value: dept,
      label: dept,
      count: results.filter(item => item.department === dept).length
    }));

    const response: ManageDataResponse = {
      data: results.slice(0, pageSize),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      filters: {
        types: typeFilters,
        departments: departmentFilters,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in manage data GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
