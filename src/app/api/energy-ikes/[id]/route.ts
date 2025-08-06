import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Session } from "next-auth";

const updateEnergyTargetSchema = z.object({
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2020).max(2030).optional(),
  ikesTarget: z.number().min(0).optional().nullable(),
  emissionTarget: z.number().min(0).optional().nullable(),
});

// Helper function to check if user can access energy data
function canAccessEnergyData(session: Session | null): {
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
    reason: "Energy data is only accessible to MTC&ENG Bureau",
  };
}

// GET - Get individual energy target
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const accessCheck = canAccessEnergyData(session);

    if (!accessCheck.canAccess) {
      return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
    }

    const { id } = await params;
    const targetId = parseInt(id);

    if (isNaN(targetId)) {
      return NextResponse.json(
        { error: "Invalid target ID" },
        { status: 400 }
      );
    }

    const target = await prisma.energyTarget.findUnique({
      where: { id: targetId },
    });

    if (!target) {
      return NextResponse.json(
        { error: "Energy target not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: target });
  } catch (error) {
    console.error("Error fetching energy target:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update energy target
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const accessCheck = canAccessEnergyData(session);

    if (!accessCheck.canAccess) {
      return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
    }

    const { id } = await params;
    const targetId = parseInt(id);

    if (isNaN(targetId)) {
      return NextResponse.json(
        { error: "Invalid target ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateEnergyTargetSchema.parse(body);

    // Check if record exists
    const existingTarget = await prisma.energyTarget.findUnique({
      where: { id: targetId },
    });

    if (!existingTarget) {
      return NextResponse.json(
        { error: "Energy target not found" },
        { status: 404 }
      );
    }

    // Check for duplicate month/year if being changed
    if (validatedData.month || validatedData.year) {
      const month = validatedData.month || existingTarget.month;
      const year = validatedData.year || existingTarget.year;

      const duplicate = await prisma.energyTarget.findFirst({
        where: {
          month,
          year,
          id: { not: targetId }, // Exclude current record
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            error: `Data energy target untuk ${month}/${year} sudah ada`,
          },
          { status: 400 }
        );
      }
    }

    const updatedTarget = await prisma.energyTarget.update({
      where: { id: targetId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Energy target berhasil diupdate",
      data: updatedTarget,
    });
  } catch (error) {
    console.error("Error updating energy target:", error);

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

// DELETE - Delete energy target
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const accessCheck = canAccessEnergyData(session);

    if (!accessCheck.canAccess) {
      return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
    }

    const { id } = await params;
    const targetId = parseInt(id);

    if (isNaN(targetId)) {
      return NextResponse.json(
        { error: "Invalid target ID" },
        { status: 400 }
      );
    }

    // Check if record exists
    const existingTarget = await prisma.energyTarget.findUnique({
      where: { id: targetId },
    });

    if (!existingTarget) {
      return NextResponse.json(
        { error: "Energy target not found" },
        { status: 404 }
      );
    }

    await prisma.energyTarget.delete({
      where: { id: targetId },
    });

    return NextResponse.json({
      message: "Energy target berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting energy target:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}