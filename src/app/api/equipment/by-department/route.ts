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
    const includeStatus = searchParams.get("includeStatus") === "true";

    if (!departmentId) {
      return apiUtils.createApiError("Department ID is required", 400);
    }

    const deptId = parseInt(departmentId);

    // Check if user has access to this department
    const hasAccess = await dbUtils.checkDepartmentAccess(
      parseInt(session.user.id),
      deptId
    );

    if (!hasAccess) {
      return apiUtils.createApiError("Access denied to this department", 403);
    }

    // Build include object dynamically
    const includeObj = {
      category: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      equipmentDepartments: {
        where: { 
          departmentId: deptId,
          isActive: true 
        },
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
    };

    if (includeStatus) {
      (includeObj as Record<string, unknown>).equipmentStatusHistory = {
        orderBy: { changedAt: "desc" },
        take: 1,
        include: {
          changedBy: {
            select: { username: true },
          },
        },
      };
    }

    const equipment = await prisma.equipment.findMany({
      where: {
        isActive: true,
        equipmentDepartments: {
          some: {
            departmentId: deptId,
            isActive: true,
          },
        },
      },
      include: includeObj,
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    });

    // Transform data to include current status if requested
    const equipmentWithStatus = equipment.map((eq) => {
      const baseEquipment = { ...eq };
      
      if (includeStatus) {
        // Type assertion untuk equipmentStatusHistory
        const eqWithHistory = eq as typeof eq & {
          equipmentStatusHistory?: Array<{
            status: string;
            changedAt: Date;
            changedBy?: { username: string };
          }>;
        };
        
        return {
          ...baseEquipment,
          currentStatus: eqWithHistory.equipmentStatusHistory?.[0]?.status || "WORKING",
          lastStatusChange: eqWithHistory.equipmentStatusHistory?.[0]?.changedAt || eq.createdAt,
          lastChangedBy: eqWithHistory.equipmentStatusHistory?.[0]?.changedBy?.username || "System",
        };
      }
      
      return baseEquipment;
    });

    return Response.json(
      apiUtils.createApiResponse(
        equipmentWithStatus,
        "Equipment retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching equipment by department:", error);
    return apiUtils.createApiError("Internal server error", 500);
  }
}