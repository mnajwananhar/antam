import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Session } from "next-auth";

const createSafetyIncidentSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2030),
  nearmiss: z.number().int().min(0).default(0),
  kecAlat: z.number().int().min(0).default(0),
  kecKecil: z.number().int().min(0).default(0),
  kecRingan: z.number().int().min(0).default(0),
  kecBerat: z.number().int().min(0).default(0),
  fatality: z.number().int().min(0).default(0),
});

// Helper function to check if user can access safety incident data
function canAccessSafetyIncident(session: Session | null): {
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

  // Check if user is from MTC&ENG Bureau
  if (session.user.departmentName === "MTC&ENG Bureau") {
    return { canAccess: true };
  }

  return {
    canAccess: false,
    reason: "Safety incident data is only accessible to MTC&ENG Bureau",
  };
}

// GET - Ambil data safety incidents
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const accessCheck = canAccessSafetyIncident(session);

    if (!accessCheck.canAccess) {
      return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    // Build filters
    const whereClause: { year?: number; month?: number } = {};

    if (year) {
      whereClause.year = parseInt(year);
    }

    if (month) {
      whereClause.month = parseInt(month);
    }

    // Get safety incidents
    const incidents = await prisma.safetyIncident.findMany({
      where: whereClause,
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json({
      success: true,
      data: incidents,
    });
  } catch (error) {
    console.error("Error fetching safety incidents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Buat atau update safety incident
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const accessCheck = canAccessSafetyIncident(session);

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
    const validatedData = createSafetyIncidentSchema.parse(body);

    // Check if data for this month/year already exists
    const existingIncident = await prisma.safetyIncident.findUnique({
      where: {
        month_year: {
          month: validatedData.month,
          year: validatedData.year,
        },
      },
    });

    let incident;

    if (existingIncident) {
      // Update existing data
      incident = await prisma.safetyIncident.update({
        where: { id: existingIncident.id },
        data: {
          nearmiss: validatedData.nearmiss,
          kecAlat: validatedData.kecAlat,
          kecKecil: validatedData.kecKecil,
          kecRingan: validatedData.kecRingan,
          kecBerat: validatedData.kecBerat,
          fatality: validatedData.fatality,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new data
      incident = await prisma.safetyIncident.create({
        data: validatedData,
      });
    }

    return NextResponse.json({
      success: true,
      data: incident,
      message: existingIncident
        ? "Data safety incident berhasil diupdate"
        : "Data safety incident berhasil dibuat",
    });
  } catch (error) {
    console.error("Error creating/updating safety incident:", error);

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
