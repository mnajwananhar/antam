import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiUtils } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiUtils.createApiError("Unauthorized", 401);
    }

    const { id } = await context.params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return apiUtils.createApiError("Invalid job ID", 400);
    }

    const jobLibrary = await prisma.jobLibrary.findUnique({
      where: { id: jobId },
      include: {
        activities: {
          include: {
            object: {
              select: {
                id: true,
                materialNumber: true,
                materialName: true,
              },
            },
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!jobLibrary) {
      return apiUtils.createApiError("Job library not found", 404);
    }

    return apiUtils.createApiResponse(jobLibrary);
  } catch (error) {
    console.error("Error fetching job library:", error);
    return apiUtils.createApiError("Internal server error", 500);
  }
}