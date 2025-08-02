import { NotificationService } from "@/lib/services/notification.service";
import { OrderService } from "@/lib/services/order.service";
import { prisma } from "@/lib/prisma";

export class NotificationOrderTestUtil {
  /**
   * Create test data for development/testing purposes
   */
  static async createTestNotification(departmentId: number = 1, createdById: number = 1) {
    try {
      const testNotification = await NotificationService.createNotification({
        departmentId,
        reportTime: "14:30",
        urgency: "URGENT",
        problemDetail: "Test notification - Equipment malfunction detected in main processing unit",
        createdById,
      });

      console.log("✅ Test notification created:", testNotification.uniqueNumber);
      return testNotification;
    } catch (error) {
      console.error("❌ Failed to create test notification:", error);
      throw error;
    }
  }

  static async createTestOrder(notificationId: number, createdById: number = 1) {
    try {
      const testOrder = await OrderService.createOrder({
        notificationId,
        jobName: "Emergency Repair - Main Processing Unit",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        description: "Complete maintenance and repair of main processing unit including component replacement",
        activities: [
          {
            activity: "Diagnostic Check",
            object: "Main Processing Unit",
            isCompleted: false,
          },
          {
            activity: "Component Replacement",
            object: "Faulty Sensor Module",
            isCompleted: false,
          },
          {
            activity: "System Testing",
            object: "Full System",
            isCompleted: false,
          },
        ],
        createdById,
      });

      console.log("✅ Test order created:", testOrder?.id);
      return testOrder;
    } catch (error) {
      console.error("❌ Failed to create test order:", error);
      throw error;
    }
  }

  /**
   * Create a complete workflow: notification -> order
   */
  static async createTestWorkflow(departmentId: number = 1, createdById: number = 1) {
    try {
      console.log("🚀 Creating test workflow...");
      
      // Step 1: Create notification
      const notification = await this.createTestNotification(departmentId, createdById);
      
      // Step 2: Create order from notification
      const order = await this.createTestOrder(notification.id, createdById);
      
      console.log("✅ Test workflow completed!");
      console.log(`   - Notification: ${notification.uniqueNumber}`);
      console.log(`   - Order: ${order?.id}`);
      
      return { notification, order };
    } catch (error) {
      console.error("❌ Failed to create test workflow:", error);
      throw error;
    }
  }

  /**
   * Validate notification-order relationship
   */
  static async validateWorkflow(notificationId: number, orderId: number) {
    try {
      console.log("🔍 Validating workflow...");
      
      const notification = await NotificationService.findNotificationById(notificationId);
      const order = await OrderService.findOrderById(orderId);
      
      if (!notification) {
        throw new Error("Notification not found");
      }
      
      if (!order) {
        throw new Error("Order not found");
      }
      
      if (order.notification.id !== notificationId) {
        throw new Error("Order is not linked to the correct notification");
      }
      
      console.log("✅ Workflow validation passed!");
      console.log(`   - Notification: ${notification.uniqueNumber} (${notification.status})`);
      console.log(`   - Order: ${order.jobName} (${order.progress}% complete)`);
      console.log(`   - Activities: ${order.completedActivities}/${order.totalActivities}`);
      
      return { notification, order };
    } catch (error) {
      console.error("❌ Workflow validation failed:", error);
      throw error;
    }
  }

  /**
   * Simulate order progress by completing activities
   */
  static async simulateOrderProgress(orderId: number) {
    try {
      console.log("⚡ Simulating order progress...");
      
      const order = await OrderService.findOrderById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }
      
      // Complete half of the activities
      const activitiesToComplete = Math.ceil(order.activities.length / 2);
      const updatedActivities = order.activities.map((activity, index) => ({
        id: activity.id,
        activity: activity.activity,
        object: activity.object,
        isCompleted: index < activitiesToComplete,
      }));
      
      const updatedOrder = await OrderService.updateOrder(orderId, {
        activities: updatedActivities,
      });
      
      console.log(`✅ Order progress updated: ${updatedOrder?.progress}% complete`);
      return updatedOrder;
    } catch (error) {
      console.error("❌ Failed to simulate order progress:", error);
      throw error;
    }
  }

  /**
   * Clean up test data
   */
  static async cleanupTestData() {
    try {
      console.log("🧹 Cleaning up test data...");
      
      // Delete test orders and notifications (orders will be deleted via cascade)
      const result = await prisma.notification.deleteMany({
        where: {
          problemDetail: {
            contains: "Test notification",
          },
        },
      });
      
      console.log(`✅ Cleaned up ${result.count} test notifications and related orders`);
    } catch (error) {
      console.error("❌ Failed to clean up test data:", error);
      throw error;
    }
  }

  /**
   * Get system statistics
   */
  static async getSystemStats() {
    try {
      const [
        totalNotifications,
        totalOrders,
        processNotifications,
        completeNotifications,
        emergencyNotifications,
      ] = await Promise.all([
        prisma.notification.count(),
        prisma.order.count(),
        prisma.notification.count({ where: { status: "PROCESS" } }),
        prisma.notification.count({ where: { status: "COMPLETE" } }),
        prisma.notification.count({ where: { urgency: "EMERGENCY" } }),
      ]);

      const stats = {
        notifications: {
          total: totalNotifications,
          process: processNotifications,
          complete: completeNotifications,
          emergency: emergencyNotifications,
        },
        orders: {
          total: totalOrders,
        },
      };

      console.log("📊 System Statistics:");
      console.log(JSON.stringify(stats, null, 2));
      
      return stats;
    } catch (error) {
      console.error("❌ Failed to get system stats:", error);
      throw error;
    }
  }
}

// Export individual functions for easier use
export const {
  createTestNotification,
  createTestOrder,
  createTestWorkflow,
  validateWorkflow,
  simulateOrderProgress,
  cleanupTestData,
  getSystemStats,
} = NotificationOrderTestUtil;
