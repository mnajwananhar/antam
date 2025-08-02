import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      "Loading stats for user:",
      session.user.username,
      session.user.role
    );

    // Initialize stats with zeros
    const stats = {
      "operational-reports": 0,
      "kta-tta": 0,
      "kpi-utama": 0,
      "maintenance-routine": 0,
      "critical-issues": 0,
      "safety-incidents": 0,
      "energy-targets": 0,
      "energy-consumption": 0,
    };

    // Apply role-based filtering
    const userFilter: Record<string, unknown> = {};
    if (session.user.role === "PLANNER" && session.user.departmentId) {
      userFilter.departmentId = session.user.departmentId;
    }

    // Helper function to safely count records
    const safeCount = async (
      model: {
        count: (args: { where?: Record<string, unknown> }) => Promise<number>;
      },
      where: Record<string, unknown> = {}
    ) => {
      try {
        return await model.count({ where });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.warn(`Count failed for model:`, errorMessage);
        return 0;
      }
    };

    try {
      // Operational Reports - should always exist
      stats["operational-reports"] = await safeCount(
        prisma.operationalReport,
        userFilter
      );
      console.log("Operational reports count:", stats["operational-reports"]);

      // KTA & TTA
      stats["kta-tta"] = await safeCount(prisma.ktaKpiData, {
        dataType: "KTA_TTA",
        ...(session.user.role === "PLANNER" && session.user.departmentId
          ? {
              picDepartemenId: session.user.departmentId,
            }
          : {}),
      });
      console.log("KTA TTA count:", stats["kta-tta"]);

      // KPI Utama (MTC&ENG Bureau only)
      if (
        session.user.role === "ADMIN" ||
        session.user.role === "INPUTTER" ||
        session.user.departmentName === "MTC&ENG Bureau"
      ) {
        stats["kpi-utama"] = await safeCount(prisma.ktaKpiData, {
          dataType: "KPI_UTAMA",
        });
      }

      // Maintenance Routine
      stats["maintenance-routine"] = await safeCount(
        prisma.maintenanceRoutine,
        userFilter
      );

      // Critical Issues
      stats["critical-issues"] = await safeCount(
        prisma.criticalIssue,
        userFilter
      );

      // Safety Incidents (MTC&ENG Bureau only)
      if (
        session.user.role === "ADMIN" ||
        session.user.role === "INPUTTER" ||
        session.user.departmentName === "MTC&ENG Bureau"
      ) {
        stats["safety-incidents"] = await safeCount(prisma.safetyIncident);
      }

      // Energy Targets (MTC&ENG Bureau only)
      if (
        session.user.role === "ADMIN" ||
        session.user.role === "INPUTTER" ||
        session.user.departmentName === "MTC&ENG Bureau"
      ) {
        stats["energy-targets"] = await safeCount(prisma.energyTarget);
      }

      // Energy Consumption (MTC&ENG Bureau only)
      if (
        session.user.role === "ADMIN" ||
        session.user.role === "INPUTTER" ||
        session.user.departmentName === "MTC&ENG Bureau"
      ) {
        stats["energy-consumption"] = await safeCount(prisma.energyConsumption);
      }
    } catch (dbError) {
      console.error("Database error in stats:", dbError);
      // Return zeros if database fails
    }

    console.log("Final stats:", stats);

    return NextResponse.json({
      stats,
      timestamp: new Date().toISOString(),
      user: {
        role: session.user.role,
        department: session.user.departmentName || null,
      },
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      {
        error: "Failed to load statistics",
        stats: {
          "operational-reports": 0,
          "kta-tta": 0,
          "kpi-utama": 0,
          "maintenance-routine": 0,
          "critical-issues": 0,
          "safety-incidents": 0,
          "energy-targets": 0,
          "energy-consumption": 0,
        },
      },
      { status: 200 } // Return 200 with empty stats instead of error
    );
  }
}
