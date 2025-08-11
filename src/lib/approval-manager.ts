import { prisma } from "@/lib/prisma";
import { ApprovalStatus, Prisma } from "@prisma/client";

export interface ApprovalRequestData {
  requestType: string;
  tableName: string;
  recordId?: number;
  oldData?: Record<string, unknown>;
  newData: Record<string, unknown>;
}

export class ApprovalManager {
  /**
   * Create a new approval request
   */
  static async createApprovalRequest(
    requesterId: number,
    data: ApprovalRequestData
  ) {
    try {
      // All requests start with PENDING status regardless of user role
      const initialStatus: ApprovalStatus = ApprovalStatus.PENDING;

      const approvalRequest = await prisma.approvalRequest.create({
        data: {
          requesterId,
          status: initialStatus,
          requestType: data.requestType,
          tableName: data.tableName,
          recordId: data.recordId,
          oldData: data.oldData as Prisma.InputJsonValue | undefined,
          newData: data.newData as Prisma.InputJsonValue,
        },
        include: {
          requester: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      });

      return { success: true, data: approvalRequest };
    } catch (error) {
      console.error("Error creating approval request:", error);
      return { success: false, error: "Failed to create approval request" };
    }
  }

  /**
   * Apply approved changes to actual data
   * This is where the actual data modifications happen after approval
   */
  static async applyApprovedChanges(approvalRequest: {
    tableName: string;
    recordId?: number;
    newData: Record<string, unknown>;
    requestType: string;
  }) {
    try {
      const { tableName, recordId, newData, requestType } = approvalRequest;

      switch (requestType) {
        case "data_change":
          if (!recordId) {
            throw new Error("Record ID required for data change");
          }
          return await ApprovalManager.handleDataUpdate(tableName, recordId, newData);
          
        case "data_deletion":
          if (!recordId) {
            throw new Error("Record ID required for data deletion");
          }
          return await ApprovalManager.handleDataDeletion(tableName, recordId);
          
        default:
          throw new Error(`Unknown request type: ${requestType}`);
      }
    } catch (error) {
      console.error("Error applying approved changes:", error);
      return { success: false, error: "Failed to apply changes" };
    }
  }


  /**
   * Handle data update
   */
  private static async handleDataUpdate(tableName: string, recordId: number, data: Record<string, unknown>) {
    try {
      let result;
      
      switch (tableName) {
        case "operational_reports":
          result = await prisma.operationalReport.update({
            where: { id: recordId },
            data: data as Prisma.OperationalReportUpdateInput,
          });
          break;
        case "kta_kpi_data":
          result = await prisma.ktaKpiData.update({
            where: { id: recordId },
            data: data as Prisma.KtaKpiDataUpdateInput,
          });
          break;
        case "notifications":
          result = await prisma.notification.update({
            where: { id: recordId },
            data: data as Prisma.NotificationUpdateInput,
          });
          break;
        case "orders":
          result = await prisma.order.update({
            where: { id: recordId },
            data: data as Prisma.OrderUpdateInput,
          });
          break;
        case "maintenance_routine":
          result = await prisma.maintenanceRoutine.update({
            where: { id: recordId },
            data: data as Prisma.MaintenanceRoutineUpdateInput,
          });
          break;
        case "critical_issues":
          result = await prisma.criticalIssue.update({
            where: { id: recordId },
            data: data as Prisma.CriticalIssueUpdateInput,
          });
          break;
        case "safety_incidents":
          result = await prisma.safetyIncident.update({
            where: { id: recordId },
            data: data as Prisma.SafetyIncidentUpdateInput,
          });
          break;
        case "energy_consumption":
          result = await prisma.energyConsumption.update({
            where: { id: recordId },
            data: data as Prisma.EnergyConsumptionUpdateInput,
          });
          break;
        default:
          throw new Error(`Unsupported table for update: ${tableName}`);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error(`Error updating data in ${tableName}:`, error);
      return { success: false, error: `Failed to update data in ${tableName}` };
    }
  }

  /**
   * Handle data deletion
   */
  private static async handleDataDeletion(tableName: string, recordId: number) {
    try {
      let result;
      
      switch (tableName) {
        case "operational_reports":
          result = await prisma.operationalReport.delete({
            where: { id: recordId },
          });
          break;
        case "kta_kpi_data":
          result = await prisma.ktaKpiData.delete({
            where: { id: recordId },
          });
          break;
        case "notifications":
          result = await prisma.notification.delete({
            where: { id: recordId },
          });
          break;
        case "orders":
          result = await prisma.order.delete({
            where: { id: recordId },
          });
          break;
        case "maintenance_routine":
          result = await prisma.maintenanceRoutine.delete({
            where: { id: recordId },
          });
          break;
        case "critical_issues":
          result = await prisma.criticalIssue.delete({
            where: { id: recordId },
          });
          break;
        case "safety_incidents":
          result = await prisma.safetyIncident.delete({
            where: { id: recordId },
          });
          break;
        case "energy_consumption":
          result = await prisma.energyConsumption.delete({
            where: { id: recordId },
          });
          break;
        default:
          throw new Error(`Unsupported table for deletion: ${tableName}`);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error(`Error deleting data in ${tableName}:`, error);
      return { success: false, error: `Failed to delete data in ${tableName}` };
    }
  }


  /**
   * Get approval statistics
   */
  static async getApprovalStats(userRole?: string, departmentId?: number) {
    try {
      const whereClause: Record<string, unknown> = {};
      
      // Filter based on user role and department if needed
      if (userRole === "PLANNER" && departmentId) {
        // Planners can only see requests related to their department
        // This would need more complex logic based on your business rules
      }

      const [total, pending, approved, rejected] = await Promise.all([
        prisma.approvalRequest.count({ where: whereClause }),
        prisma.approvalRequest.count({
          where: { ...whereClause, status: ApprovalStatus.PENDING },
        }),
        prisma.approvalRequest.count({
          where: { ...whereClause, status: ApprovalStatus.APPROVED },
        }),
        prisma.approvalRequest.count({
          where: { ...whereClause, status: ApprovalStatus.REJECTED },
        }),
      ]);

      return {
        success: true,
        data: {
          total,
          pending,
          approved,
          rejected,
        },
      };
    } catch (error) {
      console.error("Error getting approval stats:", error);
      return { success: false, error: "Failed to get approval statistics" };
    }
  }
}