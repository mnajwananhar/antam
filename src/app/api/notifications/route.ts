import { NextRequest } from "next/server";
import { NotificationService } from "@/lib/services/notification.service";
import { AuthorizationUtil } from "@/lib/utils/authorization.util";
import {
  ApiResponseUtil,
  ApiErrorHandler,
} from "@/lib/utils/api-response.util";
import {
  createNotificationSchema,
  notificationQuerySchema,
} from "@/lib/validations/notification.validation";

export async function GET(request: NextRequest) {
  try {
    const session = await AuthorizationUtil.requireAuth();
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const queryData = notificationQuerySchema.parse({
      departmentId: searchParams.get("departmentId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      urgency: searchParams.get("urgency") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    // Build filters
    const filters = {
      departmentId: queryData.departmentId
        ? parseInt(queryData.departmentId)
        : undefined,
      status: queryData.status as "PROCESS" | "COMPLETE" | undefined,
      urgency: queryData.urgency as
        | "NORMAL"
        | "URGENT"
        | "EMERGENCY"
        | undefined,
      userRole: session.user.role,
      userDepartmentId: session.user.departmentId,
    };

    // Get pagination parameters
    const pagination = {
      page: queryData.page ? parseInt(queryData.page) : 1,
      limit: queryData.limit ? parseInt(queryData.limit) : 10,
    };

    const result = await NotificationService.findNotifications(
      filters,
      pagination
    );

    return ApiResponseUtil.success(result.notifications, undefined, {
      stats: result.stats,
      pagination: result.pagination,
    });
  } catch (error) {
    return ApiErrorHandler.handle(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await AuthorizationUtil.requireAuth();
    AuthorizationUtil.requireInputterOrAbove(session);

    const body = await request.json();

    // Additional logging for debugging
    console.log("Request body:", body);

    const validatedData = createNotificationSchema.parse(body);

    // Check department access
    AuthorizationUtil.requireCreatePermission(
      session,
      validatedData.departmentId
    );

    const notification = await NotificationService.createNotification({
      ...validatedData,
      createdById: parseInt(session.user.id),
    });

    return ApiResponseUtil.created(notification, "Notifikasi berhasil dibuat");
  } catch (error) {
    // Enhanced error logging
    console.error("Notification creation error:", error);
    return ApiErrorHandler.handle(error);
  }
}
