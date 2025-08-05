import { prisma } from "@/lib/prisma";
import { apiUtils } from "@/lib/utils";

export async function GET(): Promise<Response> {
  try {
    console.log("=== DEBUG ORDERS API ===");

    // Test 1: Check if orders table exists and has data
    const orderCount = await prisma.order.count();
    console.log("Total orders in database:", orderCount);

    // Test 2: Check raw orders without any relations
    const rawOrders = await prisma.order.findMany({
      take: 5,
    });
    console.log("Raw orders (first 5):", rawOrders);

    // Test 3: Check notifications
    const notificationCount = await prisma.notification.count();
    console.log("Total notifications:", notificationCount);

    // Test 4: Check order activities
    const activityCount = await prisma.orderActivity.count();
    console.log("Total order activities:", activityCount);

    // Test 5: Check users
    const userCount = await prisma.user.count();
    console.log("Total users:", userCount);

    // Test 6: Try the full query that's failing
    const fullOrders = await prisma.order.findMany({
      include: {
        notification: {
          select: {
            id: true,
            uniqueNumber: true,
            urgency: true,
            problemDetail: true,
            department: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        createdBy: {
          select: { id: true, username: true, role: true },
        },
        activities: {
          select: {
            id: true,
            activity: true,
            object: true,
            isCompleted: true,
          },
        },
      },
      take: 3,
    });
    console.log(
      "Full orders with relations (first 3):",
      JSON.stringify(fullOrders, null, 2)
    );

    return apiUtils.createApiResponse({
      debug: {
        orderCount,
        notificationCount,
        activityCount,
        userCount,
        rawOrders,
        fullOrders,
      },
    });
  } catch (error) {
    console.error("Debug API Error:", error);
    return apiUtils.createApiError(`Debug error: ${error}`, 500);
  }
}
