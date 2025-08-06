import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateCategorySchema = z.object({
  name: z.string().min(1, "Nama kategori harus diisi").optional(),
  code: z.string().min(1, "Kode kategori harus diisi").optional(),
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
    const categoryId = parseInt(id);
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    const category = await prisma.equipmentCategory.findUnique({
      where: { id: categoryId },
      include: {
        equipment: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          take: 10,
        },
        _count: {
          select: {
            equipment: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: category });
  } catch (error) {
    console.error("Error fetching category:", error);
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
    const categoryId = parseInt(id);
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateCategorySchema.parse(body);

    // Check if category exists
    const existingCategory = await prisma.equipmentCategory.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if name is being changed and if it already exists
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameExists = await prisma.equipmentCategory.findUnique({
        where: { name: validatedData.name },
      });

      if (nameExists) {
        return NextResponse.json(
          { error: "Nama kategori sudah digunakan" },
          { status: 400 }
        );
      }
    }

    // Check if code is being changed and if it already exists
    if (validatedData.code && validatedData.code !== existingCategory.code) {
      const codeExists = await prisma.equipmentCategory.findUnique({
        where: { code: validatedData.code },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: "Kode kategori sudah digunakan" },
          { status: 400 }
        );
      }
    }

    const updatedCategory = await prisma.equipmentCategory.update({
      where: { id: categoryId },
      data: validatedData,
      include: {
        _count: {
          select: {
            equipment: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Kategori berhasil diperbarui",
      data: updatedCategory,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating category:", error);
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
    const categoryId = parseInt(id);
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.equipmentCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            equipment: true,
          },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if category has equipment
    if (existingCategory._count.equipment > 0) {
      return NextResponse.json(
        { error: "Kategori tidak dapat dihapus karena masih memiliki equipment" },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const deletedCategory = await prisma.equipmentCategory.update({
      where: { id: categoryId },
      data: { isActive: false },
      include: {
        _count: {
          select: {
            equipment: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Kategori berhasil dihapus",
      data: deletedCategory,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}