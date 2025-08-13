import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  year: z.string().optional().nullable(),
  month: z.string().optional().nullable(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = querySchema.parse({
      year: searchParams.get("year"),
      month: searchParams.get("month"),
    });

    const currentYear = queryParams.year ? parseInt(queryParams.year) : new Date().getFullYear();
    const currentMonth = queryParams.month ? parseInt(queryParams.month) : new Date().getMonth() + 1;

    // Get available years from KTA KPI data
    const availableYearsFromKta = await prisma.ktaKpiData.findMany({
      where: {
        tanggal: {
          not: null,
        },
      },
      select: {
        tanggal: true,
      },
    });

    const uniqueYears = [...new Set(
      availableYearsFromKta
        .filter(item => item.tanggal)
        .map(item => new Date(item.tanggal!).getFullYear())
    )].sort((a, b) => b - a); // Sort descending



    // Safety incidents data
    const safetyIncidents = await prisma.safetyIncident.findMany({
      where: {
        year: currentYear,
      },
      orderBy: {
        month: "asc",
      },
    });

    // Energy targets and realizations
    const energyTargets = await prisma.energyTarget.findMany({
      where: {
        year: currentYear,
      },
      orderBy: {
        month: "asc",
      },
    });

    const energyRealizations = await prisma.energyRealization.findMany({
      where: {
        year: currentYear,
      },
      orderBy: {
        month: "asc",
      },
    });

    // Energy consumption data
    const energyConsumption = await prisma.energyConsumption.findMany({
      where: {
        year: currentYear,
      },
      orderBy: {
        month: "asc",
      },
    });

    // Critical issues data
    const criticalIssues = await prisma.criticalIssue.findMany({
      where: {
        department: {
          name: "MTC&ENG Bureau",
        },
      },
      include: {
        department: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // KTA KPI Data for KPI Utama and Status Tindak Lanjut
    const ktaKpiData = await prisma.ktaKpiData.findMany({
      where: {
        tanggal: {
          gte: new Date(currentYear, 0, 1), // Start of year
          lt: new Date(currentYear + 1, 0, 1), // Start of next year
        },
      },
      orderBy: {
        tanggal: "asc",
      },
    });

    // Prepare monthly data arrays
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const safetyIncidentsData = months.map((month, index) => {
      const monthData = safetyIncidents.find((item) => item.month === index + 1);
      return {
        month,
        nearmiss: monthData?.nearmiss || 0,
        kecAlat: monthData?.kecAlat || 0,
        kecKecil: monthData?.kecKecil || 0,
        kecRingan: monthData?.kecRingan || 0,
        kecBerat: monthData?.kecBerat || 0,
        fatality: monthData?.fatality || 0,
      };
    });

    const energyIkesData = months.map((month, index) => {
      const targetData = energyTargets.find((item) => item.month === index + 1);
      const realizationData = energyRealizations.find((item) => item.month === index + 1);
      return {
        month,
        ikesTarget: targetData?.ikesTarget ?? null,
        ikesRealization: realizationData?.ikesRealization ?? null,
      };
    });

    const energyEmissionData = months.map((month, index) => {
      const targetData = energyTargets.find((item) => item.month === index + 1);
      const realizationData = energyRealizations.find((item) => item.month === index + 1);
      return {
        month,
        emissionTarget: targetData?.emissionTarget ?? null,
        emissionRealization: realizationData?.emissionRealization ?? null,
      };
    });

    const energyConsumptionData = months.map((month, index) => {
      const consumptionData = energyConsumption.find((item) => item.month === index + 1);
      return {
        month,
        tambang: consumptionData?.tambangConsumption || 0,
        pabrik: consumptionData?.pabrikConsumption || 0,
        supporting: consumptionData?.supportingConsumption || 0,
        total: consumptionData
          ? consumptionData.tambangConsumption +
            consumptionData.pabrikConsumption +
            consumptionData.supportingConsumption
          : 0,
      };
    });

    // KPI Utama data (Rencana = 186 for all months, Aktual = count of KTA KPI entries per month)
    const kpiUtamaData = months.map((month, index) => {
      const monthData = ktaKpiData.filter((item) => {
        if (!item.tanggal) return false;
        return new Date(item.tanggal).getMonth() === index;
      });
      
      return {
        month,
        rencana: 186, // Static value as requested
        aktual: monthData.length,
      };
    });

    // Status Tindak Lanjut data (Open and Close status per month)
    const statusTindakLanjutData = months.map((month, index) => {
      const monthData = ktaKpiData.filter((item) => {
        if (!item.tanggal) return false;
        return new Date(item.tanggal).getMonth() === index;
      });
      
      const openCount = monthData.filter((item) => item.statusTindakLanjut === "OPEN").length;
      const closeCount = monthData.filter((item) => item.statusTindakLanjut === "CLOSE").length;
      
      return {
        month,
        open: openCount,
        close: closeCount,
      };
    });

    return NextResponse.json({
      safetyIncidents: safetyIncidentsData,
      energyIkes: energyIkesData,
      energyEmission: energyEmissionData,
      energyConsumption: energyConsumptionData,
      criticalIssues: criticalIssues.map((issue) => ({
        id: issue.id,
        issueName: issue.issueName,
        department: issue.department.code,
        status: issue.status,
        description: issue.description,
        createdAt: issue.createdAt,
      })),
      kpiUtama: kpiUtamaData,
      statusTindakLanjut: statusTindakLanjutData,
      availableYears: uniqueYears,
      year: currentYear,
      month: currentMonth,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
