import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Session } from "next-auth";

const updateEnergyConsumptionSchema = z.object({
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2020).max(2030).optional(),
  plnConsumption: z.number().min(0).optional(),
  tambangConsumption: z.number().min(0).optional(),
  pabrikConsumption: z.number().min(0).optional(),
  supportingConsumption: z.number().min(0).optional(),
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

// GET - Get individual energy consumption
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
    const consumptionId = parseInt(id);

    if (isNaN(consumptionId)) {
      return NextResponse.json(
        { error: "Invalid consumption ID" },
        { status: 400 }
      );
    }

    const consumption = await prisma.energyConsumption.findUnique({
      where: { id: consumptionId },
    });

    if (!consumption) {
      return NextResponse.json(
        { error: "Energy consumption not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: consumption });
  } catch (error) {
    console.error("Error fetching energy consumption:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update energy consumption
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
    const consumptionId = parseInt(id);

    if (isNaN(consumptionId)) {
      return NextResponse.json(
        { error: "Invalid consumption ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateEnergyConsumptionSchema.parse(body);

    // Check if record exists
    const existingConsumption = await prisma.energyConsumption.findUnique({
      where: { id: consumptionId },
    });

    if (!existingConsumption) {
      return NextResponse.json(
        { error: "Energy consumption not found" },
        { status: 404 }
      );
    }

    // Check for duplicate month/year if being changed
    if (validatedData.month || validatedData.year) {
      const month = validatedData.month || existingConsumption.month;
      const year = validatedData.year || existingConsumption.year;

      const duplicate = await prisma.energyConsumption.findFirst({
        where: {
          month,
          year,
          id: { not: consumptionId }, // Exclude current record
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            error: `Data energy consumption untuk ${month}/${year} sudah ada`,
          },
          { status: 400 }
        );
      }
    }

    const updatedConsumption = await prisma.energyConsumption.update({
      where: { id: consumptionId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Energy consumption berhasil diupdate",
      data: updatedConsumption,
    });
  } catch (error) {
    console.error("Error updating energy consumption:", error);

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

// DELETE - Delete energy consumption
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
    const consumptionId = parseInt(id);

    if (isNaN(consumptionId)) {
      return NextResponse.json(
        { error: "Invalid consumption ID" },
        { status: 400 }
      );
    }

    // Check if record exists
    const existingConsumption = await prisma.energyConsumption.findUnique({
      where: { id: consumptionId },
    });

    if (!existingConsumption) {
      return NextResponse.json(
        { error: "Energy consumption not found" },
        { status: 404 }
      );
    }

    await prisma.energyConsumption.delete({
      where: { id: consumptionId },
    });

    return NextResponse.json({
      message: "Energy consumption berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting energy consumption:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}