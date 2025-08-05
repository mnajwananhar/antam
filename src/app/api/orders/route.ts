import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiUtils, roleUtils } from "@/lib/utils";
import { z } from "zod";

const createOrderSchema = z.object({
  notificationId: z.number().positive(),
  jobName: z.string().min(1, "Job name is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .nullable()
    .optional(),
  description: z.string().optional(),
  activities: z
    .array(
      z.object({
        activity: z.string().min(1),
        object: z.string().min(1),
        isCompleted: z.boolean().default(false),
      })
    )
    .min(1, "At least one activity is required"),
});

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiUtils.createApiError("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    const whereClause: Record<string, unknown> = {};

    // Role-based filtering - Only PLANNER is restricted to their department
    if (session.user.role === "PLANNER" && session.user.departmentId) {
      whereClause.notification = {
        departmentId: session.user.departmentId,
      };
    }

    // ADMIN, INPUTTER, VIEWER can see all orders

    // Search filter
    if (search) {
      whereClause.OR = [
        { jobName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        {
          notification: {
            uniqueNumber: { contains: search, mode: "insensitive" },
          },
        },
        {
          notification: {
            department: {
              name: { contains: search, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          notification: {
            select: {
              id: true,
              uniqueNumber: true,
              urgency: true,
              problemDetail: true,
              department: {
                select: { id: true, name: true, code: true },
              },
            },
          },
          createdBy: {
            select: { id: true, username: true, role: true },
          },
          activities: {
            select: {
              id: true,
              activity: true,
              object: true,
              isCompleted: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    return apiUtils.createApiResponse({
      orders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return apiUtils.createApiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiUtils.createApiError("Unauthorized", 401);
    }

    // Check if user can create orders
    if (
      !roleUtils.canModifyData(
        session.user.role as "ADMIN" | "PLANNER" | "INPUTTER" | "VIEWER"
      )
    ) {
      return apiUtils.createApiError("Access denied", 403);
    }

    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    // Verify notification exists and user has access
    const notification = await prisma.notification.findUnique({
      where: { id: validatedData.notificationId },
      include: { department: true },
    });

    if (!notification) {
      return apiUtils.createApiError("Notification not found", 404);
    }

    // Check department access for PLANNER
    if (session.user.role === "PLANNER" && session.user.departmentId) {
      if (notification.departmentId !== session.user.departmentId) {
        return apiUtils.createApiError("Access denied to this department", 403);
      }
    }

    // Create order with activities
    const order = await prisma.order.create({
      data: {
        notificationId: validatedData.notificationId,
        jobName: validatedData.jobName,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        description: validatedData.description || null,
        createdById: parseInt(session.user.id),
        activities: {
          create: validatedData.activities.map((activity) => ({
            activity: activity.activity,
            object: activity.object,
            isCompleted: activity.isCompleted,
          })),
        },
      },
      include: {
        notification: {
          select: {
            id: true,
            uniqueNumber: true,
            urgency: true,
            problemDetail: true,
            department: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        createdBy: {
          select: { id: true, username: true, role: true },
        },
        activities: {
          select: {
            id: true,
            activity: true,
            object: true,
            isCompleted: true,
          },
        },
      },
    });

    return apiUtils.createApiResponse(order, "Order created successfully");
  } catch (error) {
    console.error("Error creating order:", error);

    if (error instanceof z.ZodError) {
      return apiUtils.createApiError(
        "Validation error: " + error.errors.map((e) => e.message).join(", "),
        400
      );
    }

    return apiUtils.createApiError("Internal server error", 500);
  }
}
