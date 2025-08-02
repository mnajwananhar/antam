import { NextRequest } from "next/server";
import { OrderService } from "@/lib/services/order.service";
import { AuthorizationUtil } from "@/lib/utils/authorization.util";
import { ApiResponseUtil, ApiErrorHandler } from "@/lib/utils/api-response.util";
import {
  createOrderSchema,
  orderQuerySchema,
} from "@/lib/validations/order.validation";

export async function GET(request: NextRequest) {
  try {
    const session = await AuthorizationUtil.requireAuth();
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const queryData = orderQuerySchema.parse({
      notificationId: searchParams.get("notificationId") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    // Build filters
    const filters = {
      notificationId: queryData.notificationId ? parseInt(queryData.notificationId) : undefined,
      userRole: session.user.role,
      userDepartmentId: session.user.departmentId,
    };

    // Get pagination parameters
    const pagination = {
      page: queryData.page ? parseInt(queryData.page) : 1,
      limit: queryData.limit ? parseInt(queryData.limit) : 10,
    };

    const result = await OrderService.findOrders(filters, pagination);

    return ApiResponseUtil.success(result.orders, undefined, {
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
    const validatedData = createOrderSchema.parse(body);

    const order = await OrderService.createOrder({
      ...validatedData,
      createdById: parseInt(session.user.id),
    });

    return ApiResponseUtil.created(order, "Order berhasil dibuat");
  } catch (error) {
    return ApiErrorHandler.handle(error);
  }
}
