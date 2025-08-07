import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiUtils } from "@/lib/utils";
import { z } from "zod";

const createJobLibrarySchema = z.object({
  jobName: z.string().min(1, "Job name is required"),
  description: z.string().optional(),
  activities: z
    .array(
      z.object({
        activity: z.string().min(1, "Activity is required"),
        objectId: z.number().positive("Object ID is required"),
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
    const whereClause: Record<string, unknown> = {
      isActive: true,
    };

    // Search filter
    if (search) {
      whereClause.OR = [
        { jobName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [jobLibraries, totalCount] = await Promise.all([
      prisma.jobLibrary.findMany({
        where: whereClause,
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
        orderBy: [{ jobName: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.jobLibrary.count({ where: whereClause }),
    ]);

    return apiUtils.createApiResponse({
      jobLibraries,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching job libraries:", error);
    return apiUtils.createApiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiUtils.createApiError("Unauthorized", 401);
    }

    // Check if user can create job libraries - only ADMIN and PLANNER
    if (!["ADMIN", "PLANNER"].includes(session.user.role)) {
      return apiUtils.createApiError("Access denied", 403);
    }

    const body = await request.json();
    const validatedData = createJobLibrarySchema.parse(body);

    // Check if job name already exists
    const existingJob = await prisma.jobLibrary.findFirst({
      where: {
        jobName: validatedData.jobName,
        isActive: true,
      },
    });

    if (existingJob) {
      return apiUtils.createApiError("Job name already exists", 400);
    }

    // Create job library with activities
    const jobLibrary = await prisma.jobLibrary.create({
      data: {
        jobName: validatedData.jobName,
        description: validatedData.description || null,
        activities: {
          create: validatedData.activities.map((activity) => ({
            activity: activity.activity,
            objectId: activity.objectId,
          })),
        },
      },
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
        },
      },
    });

    return apiUtils.createApiResponse(jobLibrary, "Job library created successfully");
  } catch (error) {
    console.error("Error creating job library:", error);

    if (error instanceof z.ZodError) {
      return apiUtils.createApiError(
        "Validation error: " + error.errors.map((e) => e.message).join(", "),
        400
      );
    }

    return apiUtils.createApiError("Internal server error", 500);
  }
}