import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiUtils } from "@/lib/utils";
import { z } from "zod";

const createJobObjectSchema = z.object({
  materialNumber: z.string().min(1, "Material number is required"),
  materialName: z.string().min(1, "Material name is required"),
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
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where clause
    const whereClause: Record<string, unknown> = {
      isActive: true,
    };

    // Search filter
    if (search) {
      whereClause.OR = [
        { materialNumber: { contains: search, mode: "insensitive" } },
        { materialName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [jobObjects, totalCount] = await Promise.all([
      prisma.jobObject.findMany({
        where: whereClause,
        orderBy: [{ materialNumber: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.jobObject.count({ where: whereClause }),
    ]);

    return apiUtils.createApiResponse({
      jobObjects,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching job objects:", error);
    return apiUtils.createApiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiUtils.createApiError("Unauthorized", 401);
    }

    // Check if user can create job objects - only ADMIN and PLANNER
    if (!["ADMIN", "PLANNER"].includes(session.user.role)) {
      return apiUtils.createApiError("Access denied", 403);
    }

    const body = await request.json();
    const validatedData = createJobObjectSchema.parse(body);

    // Check if material number already exists
    const existingObject = await prisma.jobObject.findUnique({
      where: { materialNumber: validatedData.materialNumber },
    });

    if (existingObject) {
      return apiUtils.createApiError("Material number already exists", 400);
    }

    // Create job object
    const jobObject = await prisma.jobObject.create({
      data: {
        materialNumber: validatedData.materialNumber,
        materialName: validatedData.materialName,
      },
    });

    return apiUtils.createApiResponse(jobObject, "Job object created successfully");
  } catch (error) {
    console.error("Error creating job object:", error);

    if (error instanceof z.ZodError) {
      return apiUtils.createApiError(
        "Validation error: " + error.errors.map((e) => e.message).join(", "),
        400
      );
    }

    return apiUtils.createApiError("Internal server error", 500);
  }
}