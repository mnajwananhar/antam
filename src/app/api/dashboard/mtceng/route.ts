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

    // Get KPI Utama data (equivalent to KTA/TTA for MTCENG)
    const kpiData = await prisma.ktaKpiData.findMany({
      where: {
        tanggal: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31),
        },
      },
      select: {
        id: true,
        tanggal: true,
        statusTindakLanjut: true,
      },
    });

    // Count actual KPI data for current month
    const actualKpiCount = kpiData.filter((item) => {
      if (!item.tanggal) return false;
      const itemDate = new Date(item.tanggal);
      return (
        itemDate.getFullYear() === currentYear &&
        itemDate.getMonth() + 1 === currentMonth
      );
    }).length;

    // KPI Summary with target 186
    const kpiSummary = {
      actual: actualKpiCount,
      target: 186,
      percentage: actualKpiCount > 0 ? Math.round((actualKpiCount / 186) * 100) : 0,
    };

    // Status Tindak Lanjut data
    const statusTindakLanjut = {
      open: kpiData.filter((item) => item.statusTindakLanjut === "OPEN").length,
      close: kpiData.filter((item) => item.statusTindakLanjut === "CLOSE").length,
    };

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
        pln: consumptionData?.plnConsumption || 0,
        tambang: consumptionData?.tambangConsumption || 0,
        pabrik: consumptionData?.pabrikConsumption || 0,
        supporting: consumptionData?.supportingConsumption || 0,
        total: consumptionData
          ? consumptionData.plnConsumption +
            consumptionData.tambangConsumption +
            consumptionData.pabrikConsumption +
            consumptionData.supportingConsumption
          : 0,
      };
    });

    return NextResponse.json({
      kpiSummary,
      statusTindakLanjut,
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
