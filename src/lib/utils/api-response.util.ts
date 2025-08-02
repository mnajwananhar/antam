import { NextResponse } from "next/server";
import { z } from "zod";

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiResponseUtil {
  static success<T>(
    data: T,
    message?: string,
    extras?: Partial<
      Omit<ApiSuccessResponse<T>, "success" | "data" | "message">
    >
  ): NextResponse<ApiSuccessResponse<T>> {
    return NextResponse.json({
      success: true,
      data,
      message,
      ...extras,
    });
  }

  static created<T>(
    data: T,
    message?: string,
    extras?: Partial<
      Omit<ApiSuccessResponse<T>, "success" | "data" | "message">
    >
  ): NextResponse<ApiSuccessResponse<T>> {
    return NextResponse.json(
      {
        success: true,
        data,
        message,
        ...extras,
      },
      { status: 201 }
    );
  }

  static error(
    error: string,
    status: number = 400,
    details?: unknown
  ): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
      {
        success: false,
        error,
        details,
      },
      { status }
    );
  }

  static validationError(zodError: z.ZodError): NextResponse<ApiErrorResponse> {
    return this.error(
      "Validation error",
      400,
      zodError.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }))
    );
  }

  static unauthorized(
    message: string = "Unauthorized"
  ): NextResponse<ApiErrorResponse> {
    return this.error(message, 401);
  }

  static forbidden(
    message: string = "Forbidden"
  ): NextResponse<ApiErrorResponse> {
    return this.error(message, 403);
  }

  static notFound(
    message: string = "Resource not found"
  ): NextResponse<ApiErrorResponse> {
    return this.error(message, 404);
  }

  static internalError(
    message: string = "Internal server error"
  ): NextResponse<ApiErrorResponse> {
    return this.error(message, 500);
  }
}

export class ApiErrorHandler {
  static handle(error: unknown): NextResponse<ApiErrorResponse> {
    console.error("API Error:", error);

    if (error instanceof z.ZodError) {
      return ApiResponseUtil.validationError(error);
    }

    if (error instanceof Error) {
      // Handle known business logic errors
      if (this.isBusinessLogicError(error.message)) {
        return ApiResponseUtil.error(error.message, 400);
      }

      // Handle authorization errors
      if (this.isAuthorizationError(error.message)) {
        return ApiResponseUtil.forbidden(error.message);
      }

      // Handle not found errors
      if (this.isNotFoundError(error.message)) {
        return ApiResponseUtil.notFound(error.message);
      }
    }

    return ApiResponseUtil.internalError();
  }

  private static isBusinessLogicError(message: string): boolean {
    const businessErrorKeywords = [
      "already exists",
      "cannot delete",
      "invalid",
      "must be",
      "required",
      "tidak valid",
      "wajib",
      "harus",
    ];

    return businessErrorKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private static isAuthorizationError(message: string): boolean {
    const authErrorKeywords = [
      "access denied",
      "insufficient permissions",
      "not authorized",
      "permission",
    ];

    return authErrorKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private static isNotFoundError(message: string): boolean {
    const notFoundKeywords = ["not found", "does not exist", "tidak ditemukan"];

    return notFoundKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }
}
