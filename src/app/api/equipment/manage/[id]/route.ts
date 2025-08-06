import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateEquipmentSchema = z.object({
  name: z.string().min(1, "Nama equipment harus diisi").optional(),
  code: z.string().min(1, "Kode equipment harus diisi").optional(),
  categoryId: z.number().positive("Category ID harus valid").optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const equipmentId = parseInt(id);
    if (isNaN(equipmentId)) {
      return NextResponse.json(
        { error: "Invalid equipment ID" },
        { status: 400 }
      );
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        category: true,
        equipmentStatusHistory: {
          orderBy: { changedAt: "desc" },
          take: 10,
          include: {
            changedBy: {
              select: { username: true },
            },
          },
        },
        operationalReports: {
          orderBy: { reportDate: "desc" },
          take: 5,
          include: {
            department: {
              select: { name: true },
            },
          },
        },
        _count: {
          select: {
            operationalReports: true,
            equipmentStatusHistory: true,
          },
        },
      },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipment tidak ditemukan" },
        { status: 404 }
      );
    }

    const equipmentWithStatus = {
      ...equipment,
      currentStatus: equipment.equipmentStatusHistory[0]?.status || "WORKING",
      lastStatusChange: equipment.equipmentStatusHistory[0]?.changedAt || equipment.createdAt,
      lastChangedBy: equipment.equipmentStatusHistory[0]?.changedBy?.username || "System",
    };

    return NextResponse.json({ data: equipmentWithStatus });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const equipmentId = parseInt(id);
    if (isNaN(equipmentId)) {
      return NextResponse.json(
        { error: "Invalid equipment ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateEquipmentSchema.parse(body);

    // Check if equipment exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    if (!existingEquipment) {
      return NextResponse.json(
        { error: "Equipment tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if code is being changed and if it already exists
    if (validatedData.code && validatedData.code !== existingEquipment.code) {
      const codeExists = await prisma.equipment.findUnique({
        where: { code: validatedData.code },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: "Kode equipment sudah digunakan" },
          { status: 400 }
        );
      }
    }

    // Check if category exists
    if (validatedData.categoryId) {
      const category = await prisma.equipmentCategory.findUnique({
        where: { id: validatedData.categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Kategori tidak ditemukan" },
          { status: 400 }
        );
      }
    }

    const updatedEquipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: validatedData,
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      message: "Equipment berhasil diperbarui",
      data: updatedEquipment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating equipment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const equipmentId = parseInt(id);
    if (isNaN(equipmentId)) {
      return NextResponse.json(
        { error: "Invalid equipment ID" },
        { status: 400 }
      );
    }

    // Check if equipment exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        _count: {
          select: {
            operationalReports: true,
            equipmentStatusHistory: true,
          },
        },
      },
    });

    if (!existingEquipment) {
      return NextResponse.json(
        { error: "Equipment tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if equipment has related data
    if (existingEquipment._count.operationalReports > 0) {
      return NextResponse.json(
        { error: "Equipment tidak dapat dihapus karena masih memiliki laporan operasional" },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const deletedEquipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: { isActive: false },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      message: "Equipment berhasil dihapus",
      data: deletedEquipment,
    });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}