import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiUtils } from "@/lib/utils";
import { UserRole } from "@prisma/client";

const resetPasswordSchema = z.object({
  userId: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return apiUtils.createApiError("Unauthorized", 401);
    }

    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return apiUtils.createApiError("Invalid request data", 400);
    }

    const { userId } = validation.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return apiUtils.createApiError("User not found", 404);
    }

    // Don't allow admin to reset their own password through this endpoint
    if (user.id.toString() === session.user.id) {
      return apiUtils.createApiError("Cannot reset your own password", 400);
    }

    // Reset password to default
    const defaultPassword = "password123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    return Response.json(
      apiUtils.createApiResponse(
        { userId, message: "Password reset to default" },
        "Password reset successfully"
      )
    );
  } catch (error) {
    console.error("Error resetting password:", error);
    return apiUtils.createApiError("Internal server error", 500);
  }
}
