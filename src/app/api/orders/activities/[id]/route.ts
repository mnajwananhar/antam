import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiUtils, roleUtils } from "@/lib/utils";
import { z } from "zod";

const updateActivitySchema = z.object({
  isCompleted: z.boolean(),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiUtils.createApiError("Unauthorized", 401);
    }

    // Check if user can modify data
    if (!roleUtils.canModifyData(session.user.role as "ADMIN" | "PLANNER" | "INPUTTER" | "VIEWER")) {
      return apiUtils.createApiError("Access denied", 403);
    }

    const { id } = await context.params;
    const activityId = parseInt(id);

    if (isNaN(activityId)) {
      return apiUtils.createApiError("Invalid activity ID", 400);
    }

    const body = await request.json();
    const validatedData = updateActivitySchema.parse(body);

    // Check if activity exists and get the order info for access control
    const activity = await prisma.orderActivity.findUnique({
      where: { id: activityId },
      include: {
        order: {
          include: {
            notification: {
              select: { departmentId: true }
            }
          }
        }
      }
    });

    if (!activity) {
      return apiUtils.createApiError("Activity not found", 404);
    }

    // Check department access for PLANNER
    if (session.user.role === "PLANNER" && session.user.departmentId) {
      if (activity.order.notification?.departmentId !== session.user.departmentId) {
        return apiUtils.createApiError("Access denied to this department", 403);
      }
    }

    // Update activity status
    const updatedActivity = await prisma.orderActivity.update({
      where: { id: activityId },
      data: {
        isCompleted: validatedData.isCompleted,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        activity: true,
        object: true,
        isCompleted: true,
        updatedAt: true,
      },
    });

    return apiUtils.createApiResponse(updatedActivity, "Activity status updated successfully");

  } catch (error) {
    console.error("Error updating activity status:", error);
    
    if (error instanceof z.ZodError) {
      return apiUtils.createApiError(
        "Validation error: " + error.errors.map(e => e.message).join(", "),
        400
      );
    }

    return apiUtils.createApiError("Internal server error", 500);
  }
}