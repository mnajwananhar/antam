import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const department = searchParams.get("department");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    // Get current month/year if not provided
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    // Create date range for the specified month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    // Fixed target (always 186 as per requirements)
    const FIXED_TARGET = 186;

    // Get KPI Utama data (all records regardless of department)
    const kpiUtamaCount = await prisma.ktaKpiData.count({
      where: {
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
        // No department filter for KPI Utama - include all records
      },
    });

    // Get KTA TTA data (filtered by department's picDepartemen)
    let ktaTtaCount = 0;
    
    if (department && department !== "MTCENG") {
      // Map department codes to PIC values that might be in the database
      const departmentPicMappings: Record<string, string[]> = {
        "ECDC": ["ECDC", "Electric Control", "Electrical"],
        "HETU": ["HETU", "Heavy Equipment", "Testing"],
        "MMTC": ["MMTC", "Mine Maintenance"],
        "PMTC": ["PMTC", "Plant Maintenance"],
      };

      const picValues = departmentPicMappings[department] || [department];

      ktaTtaCount = await prisma.ktaKpiData.count({
        where: {
          tanggal: {
            gte: startDate,
            lte: endDate,
          },
          picDepartemen: {
            in: picValues,
          },
        },
      });
    }

    // Get available years for the filter
    const availableYearsResult = await prisma.ktaKpiData.groupBy({
      by: ['tanggal'],
      where: {
        tanggal: {
          not: null,
        },
      },
    });

    const availableYears = Array.from(
      new Set(
        availableYearsResult
          .map(item => item.tanggal?.getFullYear())
          .filter(year => year !== undefined)
      )
    ).sort((a, b) => b - a); // Sort descending

    // Prepare response data
    const responseData = {
      kpiUtama: {
        rencana: FIXED_TARGET,
        aktual: kpiUtamaCount,
      },
      ktaTta: {
        rencana: FIXED_TARGET,
        aktual: ktaTtaCount,
      },
      metadata: {
        department: department || "ALL",
        month: targetMonth,
        year: targetYear,
        monthName: new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(startDate),
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        },
        availableYears,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching KPI/KTA data:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}