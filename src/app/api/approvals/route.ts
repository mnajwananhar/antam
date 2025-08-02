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
//   status: z.enum(["PENDING", "PENDING_ADMIN_APPROVAL", "APPROVED", "REJECTED"]),
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
      ["PENDING", "PENDING_ADMIN_APPROVAL", "APPROVED", "REJECTED"].includes(
        status
      )
    ) {
      whereClause.status = status as ApprovalStatus;
    }

    if (requestType) {
      whereClause.requestType = requestType;
    }

    // If user is PLANNER, only show requests they can approve
    if (session.user.role === "PLANNER") {
      whereClause.status = "PENDING"; // Only pending requests for planners
      // Could add more department-specific filtering here if needed
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
      pendingAdmin: await prisma.approvalRequest.count({
        where: { ...whereClause, status: "PENDING_ADMIN_APPROVAL" },
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

    // Determine initial status based on user role
    let initialStatus = "PENDING";
    if (session.user.role === "PLANNER") {
      initialStatus = "PENDING_ADMIN_APPROVAL"; // Planner requests need admin approval
    }

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
        reason: validatedData.reason,
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
