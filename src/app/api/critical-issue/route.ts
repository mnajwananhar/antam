import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EquipmentStatus, Prisma } from "@prisma/client";
import { criticalIssueSchema } from "@/lib/validations";
import { z } from "zod";

// GET - Ambil daftar critical issues
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build filters
    const whereClause: Prisma.CriticalIssueWhereInput = {};

    if (departmentId) {
      whereClause.departmentId = parseInt(departmentId);
    }

    if (status && ["WORKING", "STANDBY", "BREAKDOWN"].includes(status)) {
      whereClause.status = status as EquipmentStatus;
    }

    // Get total count
    const totalCount = await prisma.criticalIssue.count({
      where: whereClause,
    });

    // Get paginated data
    const issues = await prisma.criticalIssue.findMany({
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
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: issues,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching critical issues:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Buat critical issue baru
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate user role
    if (!["ADMIN", "PLANNER", "INPUTTER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = criticalIssueSchema.parse(body);

    // Department access control:
    // - Users can create critical issues for any department if they have proper access
    // - This is controlled by the frontend UI logic (department tab selection)
    // - Server validation focuses on user permission levels only

    // Basic role validation - only allow certain roles
    if (!["ADMIN", "PLANNER", "INPUTTER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Additional validation can be added here if needed for specific business rules

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

    // Create critical issue
    const criticalIssue = await prisma.criticalIssue.create({
      data: {
        issueName: validatedData.issueName,
        departmentId: validatedData.departmentId,
        status: validatedData.status,
        description: validatedData.description,
        createdById: parseInt(session.user.id),
      },
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
      },
    });

    return NextResponse.json({
      success: true,
      data: criticalIssue,
      message: "Critical issue berhasil dibuat",
    });
  } catch (error: unknown) {
    console.error("Error creating critical issue:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
