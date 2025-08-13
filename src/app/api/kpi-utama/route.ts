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

    // Get KPI Utama data for the selected month and year
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0);

    const kpiData = await prisma.ktaKpiData.findMany({
      where: {
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        id: true,
        tanggal: true,
      },
    });

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

    // Calculate actual count and prepare data
    const actualCount = kpiData.length;
    const rencanaCount = 186; // Fixed target as per requirements

    const chartData = [
      {
        category: "Rencana",
        value: rencanaCount,
        fill: "#f59e0b", // amber-500
      },
      {
        category: "Aktual", 
        value: actualCount,
        fill: "#3b82f6", // blue-500
      },
    ];

    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    return NextResponse.json({
      chartData,
      summary: {
        rencana: rencanaCount,
        aktual: actualCount,
        achievement: rencanaCount > 0 ? ((actualCount / rencanaCount) * 100).toFixed(1) : "0.0",
        gap: rencanaCount - actualCount,
      },
      period: {
        year: currentYear,
        month: currentMonth,
        monthName: monthNames[currentMonth - 1],
      },
      availableYears: uniqueYears,
    });
  } catch (error) {
    console.error("KPI Utama API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}