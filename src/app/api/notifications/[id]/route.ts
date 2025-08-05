import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiUtils, roleUtils } from "@/lib/utils";
import { z } from "zod";

const updateNotificationSchema = z.object({
  departmentId: z.number().positive().optional(),
  reportTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format").optional(),
  urgency: z.enum(["NORMAL", "URGENT", "EMERGENCY"]).optional(),
  problemDetail: z.string().min(10, "Problem detail must be at least 10 characters").optional(),
  status: z.enum(["PROCESS", "COMPLETE"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiUtils.createApiError("Unauthorized", 401);
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return apiUtils.createApiError("Invalid notification ID", 400);
    }

    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, username: true, role: true },
        },
        orders: {
          include: {
            activities: true,
          },
        },
      },
    });

    if (!notification) {
      return apiUtils.createApiError("Notification not found", 404);
    }

    // Check access permissions
    if (session.user.role === "PLANNER" && session.user.departmentId) {
      if (notification.departmentId !== session.user.departmentId) {
        return apiUtils.createApiError("Access denied to this department", 403);
      }
    }

    return apiUtils.createApiResponse(notification);

  } catch (error) {
    console.error("Error fetching notification:", error);
    return apiUtils.createApiError("Internal server error", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiUtils.createApiError("Unauthorized", 401);
    }

    if (!roleUtils.canModifyData(session.user.role as "ADMIN" | "PLANNER" | "INPUTTER" | "VIEWER")) {
      return apiUtils.createApiError("Access denied", 403);
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return apiUtils.createApiError("Invalid notification ID", 400);
    }

    const body = await request.json();
    const validatedData = updateNotificationSchema.parse(body);

    // Find existing notification
    const existingNotification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      return apiUtils.createApiError("Notification not found", 404);
    }

    // Check access permissions
    if (session.user.role === "PLANNER" && session.user.departmentId) {
      if (existingNotification.departmentId !== session.user.departmentId) {
        return apiUtils.createApiError("Access denied to this department", 403);
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.departmentId !== undefined) {
      // Check department access for PLANNER
      if (session.user.role === "PLANNER") {
        if (validatedData.departmentId !== session.user.departmentId) {
          return apiUtils.createApiError("Access denied to this department", 403);
        }
      }
      updateData.departmentId = validatedData.departmentId;
    }

    if (validatedData.reportTime !== undefined) {
      const timeString = validatedData.reportTime;
      updateData.reportTime = new Date(`1970-01-01T${timeString}:00.000`);
    }

    if (validatedData.urgency !== undefined) {
      updateData.urgency = validatedData.urgency;
    }

    if (validatedData.problemDetail !== undefined) {
      updateData.problemDetail = validatedData.problemDetail;
    }

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }

    // Update notification
    const notification = await prisma.notification.update({
      where: { id },
      data: updateData,
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, username: true, role: true },
        },
        orders: {
          include: {
            activities: true,
          },
        },
      },
    });

    return apiUtils.createApiResponse(notification, "Notification updated successfully");

  } catch (error) {
    console.error("Error updating notification:", error);
    
    if (error instanceof z.ZodError) {
      return apiUtils.createApiError(
        "Validation error: " + error.errors.map(e => e.message).join(", "),
        400
      );
    }

    return apiUtils.createApiError("Internal server error", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiUtils.createApiError("Unauthorized", 401);
    }

    if (!roleUtils.canDeleteData(session.user.role as "ADMIN" | "PLANNER" | "INPUTTER" | "VIEWER")) {
      return apiUtils.createApiError("Access denied", 403);
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return apiUtils.createApiError("Invalid notification ID", 400);
    }

    // Find existing notification with orders
    const existingNotification = await prisma.notification.findUnique({
      where: { id },
      include: {
        orders: true,
      },
    });

    if (!existingNotification) {
      return apiUtils.createApiError("Notification not found", 404);
    }

    // Check if notification has orders
    if (existingNotification.orders.length > 0) {
      return apiUtils.createApiError(
        "Cannot delete notification that has orders. Please delete orders first.",
        400
      );
    }

    // Check access permissions
    if (session.user.role === "PLANNER" && session.user.departmentId) {
      if (existingNotification.departmentId !== session.user.departmentId) {
        return apiUtils.createApiError("Access denied to this department", 403);
      }
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id },
    });

    return apiUtils.createApiResponse(null, "Notification deleted successfully");

  } catch (error) {
    console.error("Error deleting notification:", error);
    return apiUtils.createApiError("Internal server error", 500);
  }
}