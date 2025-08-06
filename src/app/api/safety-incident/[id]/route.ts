import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Session } from "next-auth";

const updateSafetyIncidentSchema = z.object({
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2020).max(2030).optional(),
  nearmiss: z.number().int().min(0).optional(),
  kecAlat: z.number().int().min(0).optional(),
  kecKecil: z.number().int().min(0).optional(),
  kecRingan: z.number().int().min(0).optional(),
  kecBerat: z.number().int().min(0).optional(),
  fatality: z.number().int().min(0).optional(),
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

// GET - Get individual safety incident
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const accessCheck = canAccessSafetyIncident(session);

    if (!accessCheck.canAccess) {
      return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
    }

    const { id } = await params;
    const incidentId = parseInt(id);

    if (isNaN(incidentId)) {
      return NextResponse.json(
        { error: "Invalid incident ID" },
        { status: 400 }
      );
    }

    const incident = await prisma.safetyIncident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      return NextResponse.json(
        { error: "Safety incident not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: incident });
  } catch (error) {
    console.error("Error fetching safety incident:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update safety incident
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const accessCheck = canAccessSafetyIncident(session);

    if (!accessCheck.canAccess) {
      return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
    }

    const { id } = await params;
    const incidentId = parseInt(id);

    if (isNaN(incidentId)) {
      return NextResponse.json(
        { error: "Invalid incident ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateSafetyIncidentSchema.parse(body);

    // Check if record exists
    const existingIncident = await prisma.safetyIncident.findUnique({
      where: { id: incidentId },
    });

    if (!existingIncident) {
      return NextResponse.json(
        { error: "Safety incident not found" },
        { status: 404 }
      );
    }

    // Check for duplicate month/year if being changed
    if (validatedData.month || validatedData.year) {
      const month = validatedData.month || existingIncident.month;
      const year = validatedData.year || existingIncident.year;

      const duplicate = await prisma.safetyIncident.findFirst({
        where: {
          month,
          year,
          id: { not: incidentId }, // Exclude current record
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            error: `Data safety incident untuk ${month}/${year} sudah ada`,
          },
          { status: 400 }
        );
      }
    }

    const updatedIncident = await prisma.safetyIncident.update({
      where: { id: incidentId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Safety incident berhasil diupdate",
      data: updatedIncident,
    });
  } catch (error) {
    console.error("Error updating safety incident:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Data tidak valid",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete safety incident
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const accessCheck = canAccessSafetyIncident(session);

    if (!accessCheck.canAccess) {
      return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
    }

    const { id } = await params;
    const incidentId = parseInt(id);

    if (isNaN(incidentId)) {
      return NextResponse.json(
        { error: "Invalid incident ID" },
        { status: 400 }
      );
    }

    // Check if record exists
    const existingIncident = await prisma.safetyIncident.findUnique({
      where: { id: incidentId },
    });

    if (!existingIncident) {
      return NextResponse.json(
        { error: "Safety incident not found" },
        { status: 404 }
      );
    }

    await prisma.safetyIncident.delete({
      where: { id: incidentId },
    });

    return NextResponse.json({
      message: "Safety incident berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting safety incident:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}