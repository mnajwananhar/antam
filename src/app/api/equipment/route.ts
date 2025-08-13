import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, dbUtils } from "@/lib/prisma";
import { apiUtils } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return apiUtils.createApiError("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");

    let whereClause: Record<string, unknown> = {
      isActive: true,
    };

    // If departmentId is provided, filter by department using mapping table
    if (departmentId) {
      const deptId = parseInt(departmentId);

      // Check if user has access to this department
      const hasAccess = await dbUtils.checkDepartmentAccess(
        parseInt(session.user.id),
        deptId
      );

      if (!hasAccess) {
        return apiUtils.createApiError("Access denied to this department", 403);
      }

      whereClause = {
        ...whereClause,
        equipmentDepartments: {
          some: {
            departmentId: deptId,
            isActive: true,
          },
        },
      };
    } else {
      // If no departmentId provided, get equipment from accessible departments
      const accessibleDepartments = await dbUtils.getAccessibleDepartments(
        parseInt(session.user.id)
      );

      const departmentIds = accessibleDepartments.map((dept) => dept.id);
      whereClause = {
        ...whereClause,
        equipmentDepartments: {
          some: {
            departmentId: {
              in: departmentIds,
            },
            isActive: true,
          },
        },
      };
    }

    const equipment = await prisma.equipment.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        equipmentDepartments: {
          where: { isActive: true },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    });

    // Transform data to include current status
    const equipmentWithStatus = equipment.map((eq) => ({
      ...eq,
      currentStatus: "WORKING", // Default status since history is removed
      lastStatusChange: eq.createdAt,
    }));

    return Response.json(
      apiUtils.createApiResponse(
        equipmentWithStatus,
        "Equipment retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return apiUtils.createApiError("Internal server error", 500);
  }
}
