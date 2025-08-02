import { NextRequest } from "next/server";
import { OrderService } from "@/lib/services/order.service";
import { AuthorizationUtil } from "@/lib/utils/authorization.util";
import {
  ApiResponseUtil,
  ApiErrorHandler,
} from "@/lib/utils/api-response.util";
import {
  updateOrderSchema,
  orderIdSchema,
} from "@/lib/validations/order.validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await AuthorizationUtil.requireAuth();
    const { id } = await params;
    const { id: validatedId } = orderIdSchema.parse({ id });
    const orderId = parseInt(validatedId);

    const order = await OrderService.findOrderById(
      orderId,
      session.user.role,
      session.user.departmentId
    );

    if (!order) {
      return ApiResponseUtil.notFound("Order tidak ditemukan");
    }

    return ApiResponseUtil.success(order);
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
    const { id: validatedId } = orderIdSchema.parse({ id });
    const orderId = parseInt(validatedId);

    const body = await request.json();
    const validatedData = updateOrderSchema.parse(body);

    const updatedOrder = await OrderService.updateOrder(
      orderId,
      validatedData,
      session.user.role,
      session.user.departmentId
    );

    return ApiResponseUtil.success(updatedOrder, "Order berhasil diupdate");
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
    const { id: validatedId } = orderIdSchema.parse({ id });
    const orderId = parseInt(validatedId);

    await OrderService.deleteOrder(orderId);

    return ApiResponseUtil.success(null, "Order berhasil dihapus");
  } catch (error) {
    return ApiErrorHandler.handle(error);
  }
}
