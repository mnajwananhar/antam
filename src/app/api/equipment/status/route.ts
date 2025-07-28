import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiUtils, roleUtils } from "@/lib/utils";
import { bulkEquipmentStatusSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return apiUtils.createApiError("Unauthorized", 401);
    }

    // Check if user can modify data
    if (!roleUtils.canModifyData(session.user.role)) {
      return apiUtils.createApiError("Insufficient permissions", 403);
    }

    const body = await request.json();
    const validation = bulkEquipmentStatusSchema.safeParse(body);

    if (!validation.success) {
      return apiUtils.createApiError("Invalid request data", 400);
    }

    const { updates } = validation.data;
    const userId = parseInt(session.user.id);

    // Process updates in transaction
    const results = await prisma.$transaction(async (tx) => {
      const updateResults = [];

      for (const update of updates) {
        // Verify equipment exists
        const equipment = await tx.equipment.findUnique({
          where: { id: update.equipmentId },
          select: { id: true, name: true },
        });

        if (!equipment) {
          throw new Error(`Equipment with ID ${update.equipmentId} not found`);
        }

        // Create equipment status history record
        const statusHistory = await tx.equipmentStatusHistory.create({
          data: {
            equipmentId: update.equipmentId,
            status: update.status,
            changedById: userId,
            notes: `Status updated to ${update.status}`,
          },
        });

        updateResults.push({
          equipmentId: update.equipmentId,
          status: update.status,
          timestamp: statusHistory.changedAt,
        });
      }

      return updateResults;
    });

    return Response.json(
      apiUtils.createApiResponse(
        results,
        "Equipment status updated successfully"
      )
    );
  } catch (error) {
    console.error("Error updating equipment status:", error);

    if (error instanceof Error) {
      return apiUtils.createApiError(error.message, 400);
    }

    return apiUtils.createApiError("Internal server error", 500);
  }
}
