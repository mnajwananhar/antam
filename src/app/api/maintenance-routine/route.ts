import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createMaintenanceRoutineSchema = z.object({
  jobName: z.string().min(1, "Nama pekerjaan wajib diisi"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)")
    .optional(),
  description: z.string().optional(),
  departmentId: z.number().int().positive("Department ID tidak valid"),
  activities: z
    .array(
      z.object({
        activity: z.string().min(1, "Aktivitas wajib diisi"),
        object: z.string().min(1, "Object wajib diisi"),
      })
    )
    .optional()
    .default([]),
});

// Utility function untuk generate nomor unik
function generateUniqueNumber(departmentCode: string, date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  // Format: DEPT-YYYYMMDD-XXX (XXX akan di-increment di database)
  return `${departmentCode}-${year}${month}${day}`;
}

// GET - Ambil daftar maintenance routines
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build filters
    const whereClause: { departmentId?: number } = {};

    if (departmentId) {
      whereClause.departmentId = parseInt(departmentId);
    }

    // If user is PLANNER, only show their department
    if (session.user.role === "PLANNER" && session.user.departmentId) {
      whereClause.departmentId = session.user.departmentId;
    }

    // Get total count
    const totalCount = await prisma.maintenanceRoutine.count({
      where: whereClause,
    });

    // Get paginated data
    const routines = await prisma.maintenanceRoutine.findMany({
      where: whereClause,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        activities: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: routines,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching maintenance routines:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Buat maintenance routine baru
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and PLANNER can create maintenance routines
    if (!["ADMIN", "PLANNER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Only admin and planner can create maintenance routines" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createMaintenanceRoutineSchema.parse(body);

    // Check department access for PLANNER
    if (session.user.role === "PLANNER" && session.user.departmentId) {
      if (validatedData.departmentId !== session.user.departmentId) {
        return NextResponse.json(
          { error: "Access denied to this department" },
          { status: 403 }
        );
      }
    }

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: validatedData.departmentId },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    // Validate dates
    const startDate = new Date(validatedData.startDate);
    const endDate = validatedData.endDate
      ? new Date(validatedData.endDate)
      : null;

    if (endDate && endDate <= startDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Generate unique number base
    const uniqueNumberBase = generateUniqueNumber(department.code, startDate);

    // Find the next sequence number for this department and date
    const existingCount = await prisma.maintenanceRoutine.count({
      where: {
        uniqueNumber: {
          startsWith: uniqueNumberBase,
        },
      },
    });

    const sequenceNumber = String(existingCount + 1).padStart(3, "0");
    const uniqueNumber = `${uniqueNumberBase}-${sequenceNumber}`;

    // Create maintenance routine with activities in a transaction
    const maintenanceRoutine = await prisma.$transaction(async (tx) => {
      const routine = await tx.maintenanceRoutine.create({
        data: {
          uniqueNumber,
          jobName: validatedData.jobName,
          startDate: startDate,
          endDate: endDate,
          description: validatedData.description,
          departmentId: validatedData.departmentId,
          createdById: parseInt(session.user.id),
          type: "PREM", // Default to Preventive Maintenance
        },
      });

      // Create activities if provided
      if (validatedData.activities && validatedData.activities.length > 0) {
        await tx.maintenanceActivity.createMany({
          data: validatedData.activities.map((activity) => ({
            maintenanceRoutineId: routine.id,
            activity: activity.activity,
            object: activity.object,
          })),
        });
      }

      return routine;
    });

    // Fetch the complete data with relations
    const completeRoutine = await prisma.maintenanceRoutine.findUnique({
      where: { id: maintenanceRoutine.id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        activities: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: completeRoutine,
      message: "Maintenance routine berhasil dibuat",
    });
  } catch (error) {
    console.error("Error creating maintenance routine:", error);

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
