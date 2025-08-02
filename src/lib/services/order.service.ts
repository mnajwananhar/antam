import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface CreateOrderInput {
  notificationId: number;
  jobName: string;
  startDate: string;
  endDate?: string;
  description?: string;
  activities?: OrderActivityInput[];
  createdById: number;
}

export interface UpdateOrderInput {
  jobName?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  activities?: OrderActivityUpdateInput[];
}

export interface OrderActivityInput {
  activity: string;
  object: string;
  isCompleted?: boolean;
}

export interface OrderActivityUpdateInput extends OrderActivityInput {
  id?: number;
}

export interface OrderFilters {
  notificationId?: number;
  userRole?: string;
  userDepartmentId?: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface OrderWithProgress {
  id: number;
  jobName: string;
  startDate: Date;
  endDate?: Date | null;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  progress: number;
  totalActivities: number;
  completedActivities: number;
  notification: {
    id: number;
    uniqueNumber: string;
    urgency: string;
    department: {
      id: number;
      name: string;
      code: string;
    };
  };
  createdBy: {
    id: number;
    username: string;
    role: string;
  };
  activities: {
    id: number;
    activity: string;
    object: string;
    isCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

export class OrderService {
  private static readonly ORDER_INCLUDE = {
    notification: {
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
    createdBy: {
      select: {
        id: true,
        username: true,
        role: true,
      },
    },
    activities: true,
  } as const;

  static async findOrders(
    filters: OrderFilters,
    pagination: PaginationOptions
  ) {
    const whereClause = this.buildWhereClause(filters);

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: this.ORDER_INCLUDE,
        orderBy: {
          createdAt: "desc",
        },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    const ordersWithProgress = orders.map(this.calculateOrderProgress);
    const stats = this.calculateOrderStats(ordersWithProgress);

    return {
      orders: ordersWithProgress,
      totalCount,
      stats,
      pagination: {
        ...pagination,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pagination.limit),
      },
    };
  }

  static async findOrderById(
    id: number,
    userRole?: string,
    userDepartmentId?: number
  ) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: this.ORDER_INCLUDE,
    });

    if (!order) {
      return null;
    }

    // Check access permissions
    if (this.shouldCheckDepartmentAccess(userRole, userDepartmentId)) {
      if (order.notification.departmentId !== userDepartmentId) {
        throw new Error("Access denied to this department");
      }
    }

    return this.calculateOrderProgress(order);
  }

  static async createOrder(input: CreateOrderInput) {
    await this.validateNotificationAccess(input.notificationId);

    this.validateOrderDates(input.startDate, input.endDate);

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          notificationId: input.notificationId,
          jobName: input.jobName,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          description: input.description,
          createdById: input.createdById,
        },
      });

      if (input.activities && input.activities.length > 0) {
        await tx.orderActivity.createMany({
          data: input.activities.map((activity) => ({
            orderId: createdOrder.id,
            activity: activity.activity,
            object: activity.object,
            isCompleted: activity.isCompleted || false,
          })),
        });
      }

      return createdOrder;
    });

    return this.findOrderById(order.id);
  }

  static async updateOrder(
    id: number,
    input: UpdateOrderInput,
    userRole?: string,
    userDepartmentId?: number
  ) {
    const existingOrder = await this.findOrderWithActivities(id);

    if (!existingOrder) {
      throw new Error("Order not found");
    }

    // Check access permissions
    if (this.shouldCheckDepartmentAccess(userRole, userDepartmentId)) {
      if (existingOrder.notification.departmentId !== userDepartmentId) {
        throw new Error("Access denied to this department");
      }
    }

    if (input.startDate && input.endDate) {
      this.validateOrderDates(input.startDate, input.endDate);
    }

    await prisma.$transaction(async (tx) => {
      // Update order basic info
      const orderData = this.buildOrderUpdateData(input);

      if (Object.keys(orderData).length > 0) {
        await tx.order.update({
          where: { id },
          data: {
            ...orderData,
            updatedAt: new Date(),
          },
        });
      }

      // Update activities if provided
      if (input.activities) {
        await this.updateOrderActivities(
          tx,
          id,
          existingOrder.activities,
          input.activities
        );
      }
    });

    return this.findOrderById(id);
  }

  static async deleteOrder(id: number) {
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        activities: true,
      },
    });

    if (!existingOrder) {
      throw new Error("Order not found");
    }

    await prisma.order.delete({
      where: { id },
    });
  }

  private static buildWhereClause(
    filters: OrderFilters
  ): Prisma.OrderWhereInput {
    const whereClause: Prisma.OrderWhereInput = {};

    if (filters.notificationId) {
      whereClause.notificationId = filters.notificationId;
    }

    // Filter by user's department for PLANNER role
    if (
      this.shouldCheckDepartmentAccess(
        filters.userRole,
        filters.userDepartmentId
      )
    ) {
      whereClause.notification = {
        departmentId: filters.userDepartmentId,
      };
    }

    return whereClause;
  }

  private static calculateOrderProgress(order: {
    id: number;
    jobName: string;
    startDate: Date;
    endDate?: Date | null;
    description?: string | null;
    createdAt: Date;
    updatedAt: Date;
    notification: {
      id: number;
      uniqueNumber: string;
      urgency: string;
      department: {
        id: number;
        name: string;
        code: string;
      };
    };
    createdBy: {
      id: number;
      username: string;
      role: string;
    };
    activities: {
      id: number;
      activity: string;
      object: string;
      isCompleted: boolean;
      createdAt: Date;
      updatedAt: Date;
    }[];
  }): OrderWithProgress {
    const totalActivities = order.activities.length;
    const completedActivities = order.activities.filter(
      (a) => a.isCompleted
    ).length;
    const progress =
      totalActivities > 0
        ? Math.round((completedActivities / totalActivities) * 100)
        : 0;

    return {
      ...order,
      progress,
      totalActivities,
      completedActivities,
    };
  }

  private static calculateOrderStats(orders: OrderWithProgress[]) {
    const total = orders.length;
    const inProgress = orders.filter(
      (order) =>
        order.totalActivities > 0 &&
        order.completedActivities < order.totalActivities
    ).length;
    const completed = orders.filter(
      (order) =>
        order.totalActivities > 0 &&
        order.completedActivities === order.totalActivities
    ).length;
    const averageProgress =
      total > 0
        ? Math.round(
            orders.reduce((acc, order) => acc + order.progress, 0) / total
          )
        : 0;

    return { total, inProgress, completed, averageProgress };
  }

  private static async validateNotificationAccess(notificationId: number) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        department: true,
      },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification;
  }

  private static validateOrderDates(startDate: string, endDate?: string) {
    if (!endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      throw new Error("End date must be after start date");
    }
  }

  private static async findOrderWithActivities(id: number) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        notification: true,
        activities: true,
      },
    });
  }

  private static buildOrderUpdateData(input: UpdateOrderInput) {
    const orderData: Partial<{
      jobName: string;
      startDate: Date;
      endDate: Date | null;
      description: string | null;
    }> = {};

    if (input.jobName) orderData.jobName = input.jobName;
    if (input.startDate) orderData.startDate = new Date(input.startDate);
    if (input.endDate !== undefined) {
      orderData.endDate = input.endDate ? new Date(input.endDate) : null;
    }
    if (input.description !== undefined)
      orderData.description = input.description;

    return orderData;
  }

  private static async updateOrderActivities(
    tx: Prisma.TransactionClient,
    orderId: number,
    existingActivities: { id: number }[],
    newActivities: OrderActivityUpdateInput[]
  ) {
    const existingActivityIds = existingActivities.map((a) => a.id);
    const newActivityIds = newActivities.filter((a) => a.id).map((a) => a.id!);
    const activitiesToDelete = existingActivityIds.filter(
      (id) => !newActivityIds.includes(id)
    );

    // Delete removed activities
    if (activitiesToDelete.length > 0) {
      await tx.orderActivity.deleteMany({
        where: {
          id: { in: activitiesToDelete },
        },
      });
    }

    // Update or create activities
    for (const activity of newActivities) {
      if (activity.id) {
        // Update existing activity
        await tx.orderActivity.update({
          where: { id: activity.id },
          data: {
            activity: activity.activity,
            object: activity.object,
            isCompleted: activity.isCompleted || false,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new activity
        await tx.orderActivity.create({
          data: {
            orderId: orderId,
            activity: activity.activity,
            object: activity.object,
            isCompleted: activity.isCompleted || false,
          },
        });
      }
    }
  }

  private static shouldCheckDepartmentAccess(
    userRole?: string,
    userDepartmentId?: number
  ): boolean {
    return userRole === "PLANNER" && userDepartmentId !== undefined;
  }
}
