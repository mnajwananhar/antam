import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateUpdateStatus } from "@/lib/utils/kta-tta";

// GET /api/kta-tta/[id] - Get single KTA/TTA record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const record = await prisma.ktaKpiData.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { username: true },
        },
      },
    });

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Error fetching KTA/TTA record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/kta-tta/[id] - Update KTA/TTA status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const body = await request.json();
    const { statusTindakLanjut } = body;

    // Validate status
    if (!["OPEN", "CLOSE"].includes(statusTindakLanjut)) {
      return NextResponse.json(
        { error: "Invalid status. Must be OPEN or CLOSE" },
        { status: 400 }
      );
    }

    // Get current record to calculate new updateStatus
    const currentRecord = await prisma.ktaKpiData.findUnique({
      where: { id },
    });

    if (!currentRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Calculate new update status
    let newUpdateStatus = "Proses";
    if (statusTindakLanjut === "CLOSE") {
      newUpdateStatus = "Close";
    } else if (currentRecord.dueDate) {
      newUpdateStatus = calculateUpdateStatus(
        currentRecord.dueDate,
        statusTindakLanjut
      );
    }

    // Update record
    const updatedRecord = await prisma.ktaKpiData.update({
      where: { id },
      data: {
        statusTindakLanjut: statusTindakLanjut as "OPEN" | "CLOSE",
        updateStatus: newUpdateStatus,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `Status berhasil diubah menjadi ${statusTindakLanjut}`,
      data: updatedRecord,
    });
  } catch (error) {
    console.error("Error updating KTA/TTA status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/kta-tta/[id] - Update KTA/TTA record (for edit modal)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const body = await request.json();
    const { statusTindakLanjut } = body;

    // Validate status
    if (!statusTindakLanjut || !["OPEN", "CLOSE"].includes(statusTindakLanjut)) {
      return NextResponse.json(
        { error: "Invalid status. Must be OPEN or CLOSE" },
        { status: 400 }
      );
    }

    // Get current record to calculate new updateStatus
    const currentRecord = await prisma.ktaKpiData.findUnique({
      where: { id },
    });

    if (!currentRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Calculate new update status
    let newUpdateStatus = "Proses";
    if (statusTindakLanjut === "CLOSE") {
      newUpdateStatus = "Close";
    } else if (currentRecord.dueDate) {
      newUpdateStatus = calculateUpdateStatus(
        currentRecord.dueDate,
        statusTindakLanjut
      );
    }

    // Update record
    const updatedRecord = await prisma.ktaKpiData.update({
      where: { id },
      data: {
        statusTindakLanjut: statusTindakLanjut as "OPEN" | "CLOSE",
        updateStatus: newUpdateStatus,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `Data berhasil diperbarui`,
      data: updatedRecord,
    });
  } catch (error) {
    console.error("Error updating KTA/TTA record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/kta-tta/[id] - Delete KTA/TTA record (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    await prisma.ktaKpiData.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Record berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting KTA/TTA record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
