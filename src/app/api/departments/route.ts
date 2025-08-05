import { auth } from "@/lib/auth";
import { dbUtils } from "@/lib/prisma";
import { apiUtils } from "@/lib/utils";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return apiUtils.createApiError("Unauthorized", 401);
    }

    // Get accessible departments based on user role
    const accessibleDepartments = await dbUtils.getAccessibleDepartments(
      parseInt(session.user.id)
    );

    return apiUtils.createApiResponse(
      accessibleDepartments,
      "Departments retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching departments:", error);
    return apiUtils.createApiError("Internal server error", 500);
  }
}
