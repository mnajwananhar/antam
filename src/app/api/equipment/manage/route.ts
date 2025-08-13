import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const equipmentSchema = z.object({
  name: z.string().min(1, "Nama equipment harus diisi"),
  code: z.string().min(1, "Kode equipment harus diisi"),
  categoryId: z.number().positive("Category ID harus valid"),
  departmentId: z.number().positive("Department ID harus valid").optional(),
});


export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statsOnly = searchParams.get("stats") === "true";
    
    // If stats only, return equipment statistics
    if (statsOnly) {
      const search = searchParams.get("search") || "";
      const categoryId = searchParams.get("categoryId");
      
      const where = {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  { code: { contains: search, mode: "insensitive" as const } },
                ],
              }
            : {},
          categoryId && categoryId !== "all"
            ? { categoryId: parseInt(categoryId) }
            : {},
          { isActive: true },
        ],
      };
      
      const equipment = await prisma.equipment.findMany({
        where,
        include: {
          equipmentStatusHistory: {
            orderBy: { changedAt: "desc" },
            take: 1,
          },
        },
      });
      
      const stats = equipment.reduce(
        (acc, eq) => {
          const currentStatus = eq.equipmentStatusHistory[0]?.status || "WORKING";
          acc.total++;
          if (currentStatus === "WORKING") acc.working++;
          else if (currentStatus === "BREAKDOWN") acc.breakdown++;
          else if (currentStatus === "STANDBY") acc.standby++;
          return acc;
        },
        { total: 0, working: 0, breakdown: 0, standby: 0 }
      );
      
      return NextResponse.json({ stats });
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const skip = (page - 1) * limit;

    const where = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { code: { contains: search, mode: "insensitive" as const } },
                { category: { name: { contains: search, mode: "insensitive" as const } } },
              ],
            }
          : {},
        categoryId && categoryId !== "all" ? { categoryId: parseInt(categoryId) } : {},
      ],
    };

    const [equipment, total] = await prisma.$transaction([
      prisma.equipment.findMany({
        where,
        include: {
          category: true,
          equipmentDepartments: {
            where: { isActive: true },
            include: {
              department: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          equipmentStatusHistory: {
            orderBy: { changedAt: "desc" },
            take: 1,
            include: {
              changedBy: {
                select: { username: true },
              },
            },
          },
          _count: {
            select: {
              operationalReports: true,
            },
          },
        },
        orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
      prisma.equipment.count({ where }),
    ]);

    const equipmentWithStatus = equipment.map((eq) => ({
      ...eq,
      currentStatus: eq.equipmentStatusHistory[0]?.status || "WORKING",
      lastStatusChange: eq.equipmentStatusHistory[0]?.changedAt || eq.createdAt,
      lastChangedBy: eq.equipmentStatusHistory[0]?.changedBy?.username || "System",
    }));

    return NextResponse.json({
      data: equipmentWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching equipment:", error);
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
    const validatedData = equipmentSchema.parse(body);

    // Check if code already exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { code: validatedData.code },
    });

    if (existingEquipment) {
      return NextResponse.json(
        { error: "Kode equipment sudah digunakan" },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await prisma.equipmentCategory.findUnique({
      where: { id: validatedData.categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan" },
        { status: 400 }
      );
    }

    const equipment = await prisma.equipment.create({
      data: validatedData,
      include: {
        category: true,
        equipmentDepartments: {
          where: { isActive: true },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    // Create initial status history
    await prisma.equipmentStatusHistory.create({
      data: {
        equipmentId: equipment.id,
        status: "WORKING",
        changedById: parseInt(session.user.id),
      },
    });

    return NextResponse.json({
      message: "Equipment berhasil ditambahkan",
      data: equipment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating equipment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}