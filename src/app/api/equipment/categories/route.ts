import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori harus diisi"),
  code: z.string().min(1, "Kode kategori harus diisi"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const includeAll = searchParams.get("includeAll") === "true";

    if (includeAll) {
      // Return all active categories for dropdown/select components
      const categories = await prisma.equipmentCategory.findMany({
        where: {
          isActive: true,
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  { code: { contains: search, mode: "insensitive" as const } },
                ],
              }
            : {}),
        },
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              equipment: true,
            },
          },
        },
      });

      return NextResponse.json({ data: categories });
    }

    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { code: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [categories, total] = await prisma.$transaction([
      prisma.equipmentCategory.findMany({
        where,
        include: {
          _count: {
            select: {
              equipment: true,
            },
          },
        },
        orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
      prisma.equipmentCategory.count({ where }),
    ]);

    return NextResponse.json({
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = categorySchema.parse(body);

    // Check if name already exists
    const existingName = await prisma.equipmentCategory.findUnique({
      where: { name: validatedData.name },
    });

    if (existingName) {
      return NextResponse.json(
        { error: "Nama kategori sudah digunakan" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingCode = await prisma.equipmentCategory.findUnique({
      where: { code: validatedData.code },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: "Kode kategori sudah digunakan" },
        { status: 400 }
      );
    }

    const category = await prisma.equipmentCategory.create({
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
      message: "Kategori berhasil ditambahkan",
      data: category,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}