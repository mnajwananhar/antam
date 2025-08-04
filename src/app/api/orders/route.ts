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
      search: searchParams.get("search") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: searchParams.get("sortOrder") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    // Build filters
    const filters = {
      notificationId: queryData.notificationId ? parseInt(queryData.notificationId) : undefined,
      search: queryData.search,
      sortBy: queryData.sortBy as "createdAt" | "updatedAt" | "startDate" | "endDate" | "jobName" | "progress" | "departmentName" | undefined,
      sortOrder: queryData.sortOrder as "asc" | "desc" | undefined,
      status: queryData.status as "pending" | "inProgress" | "completed" | undefined,
      userRole: session.user.role,
      userDepartmentId: session.user.departmentId,
    };

    // Get pagination parameters
    const pagination = {
      page: queryData.page ? parseInt(queryData.page) : 1,
      limit: queryData.limit ? parseInt(queryData.limit) : 10,
    };

    const result = await OrderService.findOrders(filters, pagination);

    return ApiResponseUtil.success({
      data: result.orders,
      total: result.totalCount,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(result.totalCount / pagination.limit),
      hasNextPage: pagination.page < Math.ceil(result.totalCount / pagination.limit),
      hasPrevPage: pagination.page > 1,
      stats: result.stats,
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
