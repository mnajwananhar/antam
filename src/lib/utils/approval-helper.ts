import { ApprovalManager } from "@/lib/approval-manager";

interface CreateApprovalRequestParams {
  requestType: "data_change" | "data_deletion";
  tableName: string;
  recordId?: number;
  oldData?: Record<string, unknown>;
  newData: Record<string, unknown>;
  requesterId: number;
}

/**
 * Helper function to create approval requests for data changes
 */
export async function createApprovalRequest({
  requestType,
  tableName,
  recordId,
  oldData,
  newData,
  requesterId,
}: CreateApprovalRequestParams) {
  try {
    const response = await fetch("/api/approvals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestType,
        tableName,
        recordId,
        oldData,
        newData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create approval request");
    }

    const result = await response.json();
    return { success: true, data: result.data };
  } catch (error) {
    console.error("Error creating approval request:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create approval request" 
    };
  }
}

/**
 * Check if user should create approval request or can directly modify data
 */
export function shouldRequireApproval(userRole: string): boolean {
  // Only INPUTTER requires approval for data changes
  return userRole === "INPUTTER";
}

/**
 * Map data-review category to database table name
 */
export function getCategoryTableName(categoryId: string): string {
  const tableMap: Record<string, string> = {
    "operational-reports": "operational_reports",
    "kta-tta": "kta_kpi_data", 
    "kpi-utama": "kta_kpi_data",
    "maintenance-routine": "maintenance_routine",
    "critical-issues": "critical_issues",
    "safety-incidents": "safety_incidents",
    "energy-consumption": "energy_consumption",
    "notifications": "notifications",
    "orders": "orders",
  };
  
  return tableMap[categoryId] || categoryId;
}