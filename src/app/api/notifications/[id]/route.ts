import { NextRequest } from "next/server";
import { NotificationService } from "@/lib/services/notification.service";
import { AuthorizationUtil } from "@/lib/utils/authorization.util";
import {
  ApiResponseUtil,
  ApiErrorHandler,
} from "@/lib/utils/api-response.util";
import {
  updateNotificationSchema,
  notificationIdSchema,
} from "@/lib/validations/notification.validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await AuthorizationUtil.requireAuth();
    const { id } = await params;
    const { id: validatedId } = notificationIdSchema.parse({ id });
    const notificationId = parseInt(validatedId);

    const notification = await NotificationService.findNotificationById(
      notificationId,
      session.user.role,
      session.user.departmentId
    );

    if (!notification) {
      return ApiResponseUtil.notFound("Notifikasi tidak ditemukan");
    }

    return ApiResponseUtil.success(notification);
  } catch (error) {
    return ApiErrorHandler.handle(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await AuthorizationUtil.requireAuth();
    AuthorizationUtil.requireInputterOrAbove(session);

    const { id } = await params;
    const { id: validatedId } = notificationIdSchema.parse({ id });
    const notificationId = parseInt(validatedId);

    const body = await request.json();
    const validatedData = updateNotificationSchema.parse(body);

    const updatedNotification = await NotificationService.updateNotification(
      notificationId,
      validatedData,
      session.user.role,
      session.user.departmentId
    );

    return ApiResponseUtil.success(
      updatedNotification,
      "Notifikasi berhasil diupdate"
    );
  } catch (error) {
    return ApiErrorHandler.handle(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await AuthorizationUtil.requireAuth();
    AuthorizationUtil.requireDeletePermission(session);

    const { id } = await params;
    const { id: validatedId } = notificationIdSchema.parse({ id });
    const notificationId = parseInt(validatedId);

    await NotificationService.deleteNotification(notificationId);

    return ApiResponseUtil.success(null, "Notifikasi berhasil dihapus");
  } catch (error) {
    return ApiErrorHandler.handle(error);
  }
}
