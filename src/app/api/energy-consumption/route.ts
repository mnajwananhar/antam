import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Session } from "next-auth";
import { Prisma } from "@prisma/client";

const energyConsumptionSchema = z.object({
  year: z.number().int().min(2020).max(2030),
  month: z.number().int().min(1).max(12),
  tambangConsumption: z.number().min(0).default(0),
  pabrikConsumption: z.number().min(0).default(0),
  supportingConsumption: z.number().min(0).default(0),
});

// Helper function to check if user can access energy consumption data
function canAccessEnergyConsumption(session: Session | null): {
  canAccess: boolean;
  reason?: string;
} {
  if (!session) {
    return { canAccess: false, reason: "Not authenticated" };
  }

  // Only ADMIN or MTC&ENG Bureau users can access
  if (session.user.role === "ADMIN") {
    return { canAccess: true };
  }

  if (session.user.departmentName === "MTC&ENG Bureau") {
    return { canAccess: true };
  }

  return {
    canAccess: false,
    reason:
      "Access denied. Only ADMIN or MTC&ENG Bureau users can access this data.",
  };
}

// GET - Ambil data energy consumption
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const accessCheck = canAccessEnergyConsumption(session);

    if (!accessCheck.canAccess) {
      return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    // Build filters
    const whereClause: Prisma.EnergyConsumptionWhereInput = {};

    if (year) {
      whereClause.year = parseInt(year);
    }

    if (month) {
      whereClause.month = parseInt(month);
    }

    // Get energy consumption data
    const consumptionData = await prisma.energyConsumption.findMany({
      where: whereClause,
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    // Calculate totals and additional statistics
    const enrichedData = consumptionData.map((data) => {
      const total =
        data.tambangConsumption +
        data.pabrikConsumption +
        data.supportingConsumption;

      const breakdown = {
        tambangPercentage:
          total > 0 ? (data.tambangConsumption / total) * 100 : 0,
        pabrikPercentage:
          total > 0 ? (data.pabrikConsumption / total) * 100 : 0,
        supportingPercentage:
          total > 0 ? (data.supportingConsumption / total) * 100 : 0,
      };

      return {
        ...data,
        totalConsumption: total,
        breakdown,
      };
    });

    // Calculate summary statistics if multiple months
    let summary = null;
    if (enrichedData.length > 1) {
      const totals = enrichedData.reduce(
        (acc, curr) => ({
          totalTambang: acc.totalTambang + curr.tambangConsumption,
          totalPabrik: acc.totalPabrik + curr.pabrikConsumption,
          totalSupporting: acc.totalSupporting + curr.supportingConsumption,
          grandTotal: acc.grandTotal + curr.totalConsumption,
        }),
        {
          totalTambang: 0,
          totalPabrik: 0,
          totalSupporting: 0,
          grandTotal: 0,
        }
      );

      summary = {
        ...totals,
        averageMonthly: totals.grandTotal / enrichedData.length,
        monthCount: enrichedData.length,
      };
    }

    return NextResponse.json({
      success: true,
      data: enrichedData,
      summary,
    });
  } catch (error) {
    console.error("Error fetching energy consumption data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Buat atau update energy consumption data
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const accessCheck = canAccessEnergyConsumption(session);

    if (!accessCheck.canAccess) {
      return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
    }

    // Only ADMIN, PLANNER, and INPUTTER can create/update
    if (
      !session ||
      !["ADMIN", "PLANNER", "INPUTTER"].includes(session.user.role)
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = energyConsumptionSchema.parse(body);

    // Check if data for this month/year already exists
    const existingConsumption = await prisma.energyConsumption.findUnique({
      where: {
        year_month: {
          year: validatedData.year,
          month: validatedData.month,
        },
      },
    });

    let result;

    if (existingConsumption) {
      // Update existing data
      result = await prisma.energyConsumption.update({
        where: { id: existingConsumption.id },
        data: {
          tambangConsumption: validatedData.tambangConsumption,
          pabrikConsumption: validatedData.pabrikConsumption,
          supportingConsumption: validatedData.supportingConsumption,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new data
      result = await prisma.energyConsumption.create({
        data: validatedData,
      });
    }

    // Calculate totals for response
    const totalConsumption =
      result.tambangConsumption +
      result.pabrikConsumption +
      result.supportingConsumption;

    const responseData = {
      ...result,
      totalConsumption,
      breakdown: {
        tambangPercentage:
          totalConsumption > 0
            ? (result.tambangConsumption / totalConsumption) * 100
            : 0,
        pabrikPercentage:
          totalConsumption > 0
            ? (result.pabrikConsumption / totalConsumption) * 100
            : 0,
        supportingPercentage:
          totalConsumption > 0
            ? (result.supportingConsumption / totalConsumption) * 100
            : 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: existingConsumption
        ? "Data energy consumption berhasil diupdate"
        : "Data energy consumption berhasil dibuat",
    });
  } catch (error) {
    console.error("Error creating/updating energy consumption:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
