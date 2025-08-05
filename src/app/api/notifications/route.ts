import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiUtils, roleUtils } from "@/lib/utils";
import { z } from "zod";

const createNotificationSchema = z.object({
  departmentId: z.number().positive(),
  reportTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  urgency: z.enum(["NORMAL", "URGENT", "EMERGENCY"]),
  problemDetail: z.string().min(10, "Problem detail must be at least 10 characters"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiUtils.createApiError("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const departmentId = searchParams.get("departmentId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    const whereClause: Record<string, unknown> = {};

    // Role-based filtering
    if (session.user.role === "PLANNER" && session.user.departmentId) {
      whereClause.departmentId = session.user.departmentId;
    }

    // Department filter
    if (departmentId) {
      whereClause.departmentId = parseInt(departmentId);
    }

    // Status filter
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { uniqueNumber: { contains: search, mode: "insensitive" } },
        { problemDetail: { contains: search, mode: "insensitive" } },
        { department: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
          createdBy: {
            select: { id: true, username: true, role: true },
          },
          orders: {
            select: {
              id: true,
              jobName: true,
              startDate: true,
              endDate: true,
            },
          },
        },
        orderBy: [
          { urgency: "desc" }, // Emergency first
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: whereClause }),
    ]);

    // Calculate stats
    const stats = await prisma.notification.groupBy({
      by: ["status"],
      where: whereClause,
      _count: { status: true },
    });

    const statsFormatted = {
      total: totalCount,
      process: stats.find(s => s.status === "PROCESS")?._count.status || 0,
      complete: stats.find(s => s.status === "COMPLETE")?._count.status || 0,
    };

    // Format notifications data before sending
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      reportTime: notification.reportTime.toISOString().split('T')[1].substring(0, 5), // Extract HH:mm from time
    }));

    return apiUtils.createApiResponse({
      notifications: formattedNotifications,
      stats: statsFormatted,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return apiUtils.createApiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiUtils.createApiError("Unauthorized", 401);
    }

    // Check if user can create notifications
    if (!roleUtils.canModifyData(session.user.role as "ADMIN" | "PLANNER" | "INPUTTER" | "VIEWER")) {
      return apiUtils.createApiError("Access denied", 403);
    }

    const body = await request.json();
    const validatedData = createNotificationSchema.parse(body);

    // Check department access for PLANNER
    if (session.user.role === "PLANNER") {
      if (validatedData.departmentId !== session.user.departmentId) {
        return apiUtils.createApiError("Access denied to this department", 403);
      }
    }

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: validatedData.departmentId },
    });

    if (!department) {
      return apiUtils.createApiError("Department not found", 404);
    }

    // Generate unique number
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const uniqueNumberBase = `${department.code}-${year}${month}${day}`;

    const existingCount = await prisma.notification.count({
      where: {
        uniqueNumber: {
          startsWith: uniqueNumberBase,
        },
      },
    });

    const sequenceNumber = String(existingCount + 1).padStart(3, "0");
    const uniqueNumber = `${uniqueNumberBase}-${sequenceNumber}`;

    // Convert time string to Date
    const timeString = validatedData.reportTime;
    const reportTime = new Date(`1970-01-01T${timeString}:00.000`);

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        uniqueNumber,
        departmentId: validatedData.departmentId,
        reportTime,
        urgency: validatedData.urgency,
        problemDetail: validatedData.problemDetail,
        status: "PROCESS",
        type: "CORM",
        createdById: parseInt(session.user.id),
      },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, username: true, role: true },
        },
        orders: {
          select: {
            id: true,
            jobName: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    return apiUtils.createApiResponse(notification, "Notification created successfully");

  } catch (error) {
    console.error("Error creating notification:", error);
    
    if (error instanceof z.ZodError) {
      return apiUtils.createApiError(
        "Validation error: " + error.errors.map(e => e.message).join(", "),
        400
      );
    }

    return apiUtils.createApiError("Internal server error", 500);
  }
}