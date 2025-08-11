import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateMaintenanceRoutineSchema = z.object({
  jobName: z.string().min(1, "Job name is required").optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  uniqueNumber: z.string().optional(),
  type: z.enum(["PREM", "CORM"]).optional(),
});

// GET /api/maintenance-routine/[id] - Get single maintenance routine record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const record = await prisma.maintenanceRoutine.findUnique({
      where: { id },
      include: {
        department: {
          select: { name: true },
        },
        createdBy: {
          select: { username: true },
        },
      },
    });

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Check access permissions
    if (
      session.user.role === "PLANNER" &&
      session.user.departmentId &&
      record.departmentId !== session.user.departmentId
    ) {
      return NextResponse.json(
        { error: "Access denied to this department" },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Error fetching maintenance routine record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/maintenance-routine/[id] - Update maintenance routine record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate user role
    if (!["ADMIN", "PLANNER", "INPUTTER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateMaintenanceRoutineSchema.parse(body);

    // Check if record exists
    const existingRecord = await prisma.maintenanceRoutine.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Check access permissions
    if (
      session.user.role === "PLANNER" &&
      session.user.departmentId &&
      existingRecord.departmentId !== session.user.departmentId
    ) {
      return NextResponse.json(
        { error: "Access denied to this department" },
        { status: 403 }
      );
    }

    // Update record
    const updatedRecord = await prisma.maintenanceRoutine.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Data berhasil diperbarui",
      data: updatedRecord,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating maintenance routine record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/maintenance-routine/[id] - Delete maintenance routine record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.maintenanceRoutine.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Record berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting maintenance routine record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}