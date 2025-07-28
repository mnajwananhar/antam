import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiUtils } from "@/lib/utils";
import { UserRole } from "@prisma/client";

const toggleStatusSchema = z.object({
  userId: z.number(),
  isActive: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return apiUtils.createApiError("Unauthorized", 401);
    }

    const body = await request.json();
    const validation = toggleStatusSchema.safeParse(body);

    if (!validation.success) {
      return apiUtils.createApiError("Invalid request data", 400);
    }

    const { userId, isActive } = validation.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return apiUtils.createApiError("User not found", 404);
    }

    // Don't allow admin to deactivate their own account
    if (user.id.toString() === session.user.id && !isActive) {
      return apiUtils.createApiError("Cannot deactivate your own account", 400);
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        isActive: true,
      },
    });

    return Response.json(
      apiUtils.createApiResponse(
        updatedUser,
        `User ${isActive ? "activated" : "deactivated"} successfully`
      )
    );
  } catch (error) {
    console.error("Error toggling user status:", error);
    return apiUtils.createApiError("Internal server error", 500);
  }
}
