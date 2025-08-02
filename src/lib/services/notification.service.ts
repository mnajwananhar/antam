import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface CreateNotificationInput {
  departmentId: number;
  reportTime: string;
  urgency: "NORMAL" | "URGENT" | "EMERGENCY";
  problemDetail: string;
  createdById: number;
}

export interface UpdateNotificationInput {
  departmentId?: number;
  reportTime?: string;
  urgency?: "NORMAL" | "URGENT" | "EMERGENCY";
  problemDetail?: string;
  status?: "PROCESS" | "COMPLETE";
}

export interface NotificationFilters {
  departmentId?: number;
  status?: "PROCESS" | "COMPLETE";
  urgency?: "NORMAL" | "URGENT" | "EMERGENCY";
  userRole?: string;
  userDepartmentId?: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class NotificationService {
  private static readonly NOTIFICATION_INCLUDE = {
    department: {
      select: {
        id: true,
        name: true,
        code: true,
      },
    },
    createdBy: {
      select: {
        id: true,
        username: true,
        role: true,
      },
    },
    orders: {
      select: {
        id: true,
        jobName: true,
        startDate: true,
        endDate: true,
      },
    },
  } as const;

  static async findNotifications(
    filters: NotificationFilters,
    pagination: PaginationOptions
  ) {
    const whereClause = this.buildWhereClause(filters);
    
    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        include: this.NOTIFICATION_INCLUDE,
        orderBy: [
          { urgency: "desc" },
          { createdAt: "desc" },
        ],
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.notification.count({ where: whereClause }),
    ]);

    const stats = await this.calculateNotificationStats(whereClause);

    return {
      notifications,
      totalCount,
      stats,
      pagination: {
        ...pagination,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pagination.limit),
      },
    };
  }

  static async findNotificationById(
    id: number,
    userRole?: string,
    userDepartmentId?: number
  ) {
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        ...this.NOTIFICATION_INCLUDE,
        orders: {
          include: {
            activities: true,
          },
        },
      },
    });

    if (!notification) {
      return null;
    }

    // Check access permissions
    if (this.shouldCheckDepartmentAccess(userRole, userDepartmentId)) {
      if (notification.departmentId !== userDepartmentId) {
        throw new Error("Access denied to this department");
      }
    }

    return notification;
  }

  static async createNotification(input: CreateNotificationInput) {
    const department = await this.validateDepartmentExists(input.departmentId);
    const uniqueNumber = await this.generateUniqueNumber(department.code);

    return prisma.notification.create({
      data: {
        uniqueNumber,
        departmentId: input.departmentId,
        reportTime: input.reportTime,
        urgency: input.urgency,
        problemDetail: input.problemDetail,
        status: "PROCESS",
        type: "CORM",
        createdById: input.createdById,
      },
      include: this.NOTIFICATION_INCLUDE,
    });
  }

  static async updateNotification(
    id: number,
    input: UpdateNotificationInput,
    userRole?: string,
    userDepartmentId?: number
  ) {
    const existingNotification = await this.findNotificationById(
      id,
      userRole,
      userDepartmentId
    );

    if (!existingNotification) {
      throw new Error("Notification not found");
    }

    return prisma.notification.update({
      where: { id },
      data: {
        ...input,
        updatedAt: new Date(),
      },
      include: {
        ...this.NOTIFICATION_INCLUDE,
        orders: {
          include: {
            activities: true,
          },
        },
      },
    });
  }

  static async deleteNotification(id: number) {
    const existingNotification = await prisma.notification.findUnique({
      where: { id },
      include: {
        orders: true,
      },
    });

    if (!existingNotification) {
      throw new Error("Notification not found");
    }

    if (existingNotification.orders.length > 0) {
      throw new Error(
        "Cannot delete notification that has orders. Please delete orders first."
      );
    }

    await prisma.notification.delete({
      where: { id },
    });
  }

  private static buildWhereClause(filters: NotificationFilters): Prisma.NotificationWhereInput {
    const whereClause: Prisma.NotificationWhereInput = {};

    if (filters.departmentId) {
      whereClause.departmentId = filters.departmentId;
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.urgency) {
      whereClause.urgency = filters.urgency;
    }

    // Filter by user's department for PLANNER role
    if (this.shouldCheckDepartmentAccess(filters.userRole, filters.userDepartmentId)) {
      whereClause.departmentId = filters.userDepartmentId;
    }

    return whereClause;
  }

  private static async calculateNotificationStats(whereClause: Prisma.NotificationWhereInput) {
    const [total, inProcess, completed, emergency] = await Promise.all([
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({
        where: { ...whereClause, status: "PROCESS" },
      }),
      prisma.notification.count({
        where: { ...whereClause, status: "COMPLETE" },
      }),
      prisma.notification.count({
        where: { ...whereClause, urgency: "EMERGENCY" },
      }),
    ]);

    return { total, inProcess, completed, emergency };
  }

  private static async validateDepartmentExists(departmentId: number) {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new Error("Department not found");
    }

    return department;
  }

  private static async generateUniqueNumber(departmentCode: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const uniqueNumberBase = `${departmentCode}-${year}${month}${day}`;

    const existingCount = await prisma.notification.count({
      where: {
        uniqueNumber: {
          startsWith: uniqueNumberBase,
        },
      },
    });

    const sequenceNumber = String(existingCount + 1).padStart(3, "0");
    return `${uniqueNumberBase}-${sequenceNumber}`;
  }

  private static shouldCheckDepartmentAccess(
    userRole?: string,
    userDepartmentId?: number
  ): boolean {
    return userRole === "PLANNER" && userDepartmentId !== undefined;
  }
}
