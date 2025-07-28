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

    // If departmentId is provided, filter by department
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
        departmentId: deptId,
      };
    } else {
      // If no departmentId provided, get equipment from accessible departments
      const accessibleDepartments = await dbUtils.getAccessibleDepartments(
        parseInt(session.user.id)
      );

      const departmentIds = accessibleDepartments.map((dept) => dept.id);
      whereClause = {
        ...whereClause,
        departmentId: {
          in: departmentIds,
        },
      };
    }

    const equipment = await prisma.equipment.findMany({
      where: whereClause,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        equipmentStatusHistory: {
          take: 1,
          orderBy: {
            changedAt: "desc",
          },
          select: {
            status: true,
            changedAt: true,
          },
        },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Transform data to include current status
    const equipmentWithStatus = equipment.map((eq) => ({
      ...eq,
      currentStatus: eq.equipmentStatusHistory[0]?.status || "WORKING",
      lastStatusChange: eq.equipmentStatusHistory[0]?.changedAt || eq.createdAt,
      equipmentStatusHistory: undefined, // Remove from response
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
