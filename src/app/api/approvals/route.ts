import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ApprovalStatus, Prisma } from "@prisma/client";

const createApprovalRequestSchema = z.object({
  requestType: z.string().min(1, "Request type is required"),
  tableName: z.string().min(1, "Table name is required"),
  recordId: z
    .number()
    .int()
    .positive("Record ID must be a positive integer")
    .optional(),
  oldData: z.record(z.unknown()).optional(),
  newData: z.record(z.unknown()),
  reason: z.string().optional(),
});

// Remove unused schema or use it
// const updateApprovalRequestSchema = z.object({
//   status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
//   reason: z.string().optional(),
// });

// GET - Ambil daftar approval requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and PLANNER can view approvals
    if (!["ADMIN", "PLANNER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const requestType = searchParams.get("requestType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build filters with proper typing
    const whereClause: Prisma.ApprovalRequestWhereInput = {};

    if (
      status &&
      ["PENDING", "APPROVED", "REJECTED"].includes(
        status
      )
    ) {
      whereClause.status = status as ApprovalStatus;
    }

    if (requestType) {
      whereClause.requestType = requestType;
    }

    // Filter based on user role and department
    if (session.user.role === "PLANNER" && session.user.departmentId) {
      // PLANNER only sees requests related to their department
      // This would need to be implemented based on how requests relate to departments
      // For now, we'll show all requests but this should be department-filtered
    }

    // Get total count
    const totalCount = await prisma.approvalRequest.count({
      where: whereClause,
    });

    // Get paginated data
    const approvalRequests = await prisma.approvalRequest.findMany({
      where: whereClause,
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        approver: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // Pending first
        { createdAt: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate some statistics
    const stats = {
      total: totalCount,
      pending: await prisma.approvalRequest.count({
        where: { ...whereClause, status: "PENDING" },
      }),
      approved: await prisma.approvalRequest.count({
        where: { ...whereClause, status: "APPROVED" },
      }),
      rejected: await prisma.approvalRequest.count({
        where: { ...whereClause, status: "REJECTED" },
      }),
    };

    return NextResponse.json({
      success: true,
      data: approvalRequests,
      stats,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching approval requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Buat approval request baru
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createApprovalRequestSchema.parse(body);

    // All requests start with PENDING status
    const initialStatus = "PENDING";

    // Create approval request
    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        requesterId: parseInt(session.user.id),
        status: initialStatus as ApprovalStatus,
        requestType: validatedData.requestType,
        tableName: validatedData.tableName,
        recordId: validatedData.recordId,
        oldData: validatedData.oldData as Prisma.InputJsonValue | undefined,
        newData: validatedData.newData as Prisma.InputJsonValue,
      },
      include: {
        requester: {
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
      data: approvalRequest,
      message: "Approval request berhasil dibuat",
    });
  } catch (error) {
    console.error("Error creating approval request:", error);

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
