import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Session } from "next-auth";

// Define proper interfaces for energy data
interface EnergyTarget {
  id: number;
  year: number;
  month: number;
  ikesTarget?: number | null;
  emissionTarget?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EnergyRealization {
  id: number;
  year: number;
  month: number;
  ikesRealization?: number | null;
  emissionRealization?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CombinedEnergyData {
  year: number;
  month: number;
  ikesTarget?: number | null;
  emissionTarget?: number | null;
  ikesRealization?: number | null;
  emissionRealization?: number | null;
}

const energyTargetSchema = z.object({
  year: z.number().int().min(2020).max(2030),
  month: z.number().int().min(1).max(12),
  ikesTarget: z.number().min(0).optional(),
  emissionTarget: z.number().min(0).optional(),
});

const energyRealizationSchema = z.object({
  year: z.number().int().min(2020).max(2030),
  month: z.number().int().min(1).max(12),
  ikesRealization: z.number().min(0).optional(),
  emissionRealization: z.number().min(0).optional(),
});

// Helper function to check if user can access energy data
function canAccessEnergyData(session: Session | null): {
  canAccess: boolean;
  reason?: string;
} {
  if (!session?.user) {
    return {
      canAccess: false,
      reason: "Authentication required",
    };
  }

  // ADMIN can access all data
  if (session.user.role === "ADMIN") {
    return { canAccess: true };
  }

  // INPUTTER and PLANNER can access energy data for MTC&ENG operations
  if (["INPUTTER", "PLANNER"].includes(session.user.role)) {
    return { canAccess: true };
  }

  // Users from MTC&ENG Bureau can access
  if (session.user.departmentName === "MTC&ENG Bureau") {
    return { canAccess: true };
  }

  return {
    canAccess: false,
    reason:
      "Access denied. Only ADMIN, INPUTTER, PLANNER, or MTC&ENG Bureau users can access this data.",
  };
}

// GET - Ambil data energy (targets dan realizations)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const accessCheck = canAccessEnergyData(session);

    if (!accessCheck.canAccess) {
      return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const dataType = searchParams.get("type"); // 'target' or 'realization'

    // Build filters
    interface WhereClause {
      year?: number;
      month?: number;
    }

    const whereClause: WhereClause = {};

    if (year) {
      whereClause.year = parseInt(year);
    }

    if (month) {
      whereClause.month = parseInt(month);
    }

    interface ResponseData {
      targets?: EnergyTarget[];
      realizations?: EnergyRealization[];
      combined?: CombinedEnergyData[];
    }

    const responseData: ResponseData = {};

    // Fetch targets if requested or no specific type
    if (!dataType || dataType === "target") {
      const targets = await prisma.energyTarget.findMany({
        where: whereClause,
        orderBy: [{ year: "desc" }, { month: "desc" }],
      });
      responseData.targets = targets;
    }

    // Fetch realizations if requested or no specific type
    if (!dataType || dataType === "realization") {
      const realizations = await prisma.energyRealization.findMany({
        where: whereClause,
        orderBy: [{ year: "desc" }, { month: "desc" }],
      });
      responseData.realizations = realizations;
    }

    // If both are requested, combine the data for comparison
    if (!dataType) {
      const combinedData: CombinedEnergyData[] = [];
      const allPeriods = new Set<string>();

      // Collect all unique periods
      [
        ...(responseData.targets || []),
        ...(responseData.realizations || []),
      ].forEach((item: EnergyTarget | EnergyRealization) => {
        allPeriods.add(`${item.year}-${item.month}`);
      });

      // Create combined data
      Array.from(allPeriods).forEach((period: string) => {
        const [year, month] = period.split("-").map(Number);
        const target = responseData.targets?.find(
          (t: EnergyTarget) => t.year === year && t.month === month
        );
        const realization = responseData.realizations?.find(
          (r: EnergyRealization) => r.year === year && r.month === month
        );

        combinedData.push({
          year,
          month,
          ikesTarget: target?.ikesTarget || null,
          emissionTarget: target?.emissionTarget || null,
          ikesRealization: realization?.ikesRealization || null,
          emissionRealization: realization?.emissionRealization || null,
        });
      });

      responseData.combined = combinedData.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching energy data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Buat atau update energy data
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const accessCheck = canAccessEnergyData(session);

    if (!accessCheck.canAccess) {
      return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
    }

    // Only ADMIN, PLANNER, and INPUTTER can create/update
    if (
      !session?.user ||
      !["ADMIN", "PLANNER", "INPUTTER"].includes(session.user.role)
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { dataType, ...data } = body;

    if (!dataType || !["target", "realization"].includes(dataType)) {
      return NextResponse.json(
        { error: "Data type must be 'target' or 'realization'" },
        { status: 400 }
      );
    }

    let result;

    if (dataType === "target") {
      const validatedData = energyTargetSchema.parse(data);

      // Check if data for this month/year already exists
      const existingTarget = await prisma.energyTarget.findUnique({
        where: {
          year_month: {
            year: validatedData.year,
            month: validatedData.month,
          },
        },
      });

      if (existingTarget) {
        // Update existing data
        result = await prisma.energyTarget.update({
          where: { id: existingTarget.id },
          data: {
            ikesTarget: validatedData.ikesTarget,
            emissionTarget: validatedData.emissionTarget,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new data
        result = await prisma.energyTarget.create({
          data: validatedData,
        });
      }
    } else {
      const validatedData = energyRealizationSchema.parse(data);

      // Check if data for this month/year already exists
      const existingRealization = await prisma.energyRealization.findUnique({
        where: {
          year_month: {
            year: validatedData.year,
            month: validatedData.month,
          },
        },
      });

      if (existingRealization) {
        // Update existing data
        result = await prisma.energyRealization.update({
          where: { id: existingRealization.id },
          data: {
            ikesRealization: validatedData.ikesRealization,
            emissionRealization: validatedData.emissionRealization,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new data
        result = await prisma.energyRealization.create({
          data: validatedData,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Energy ${dataType} berhasil disimpan`,
    });
  } catch (error) {
    console.error("Error creating/updating energy data:", error);

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
