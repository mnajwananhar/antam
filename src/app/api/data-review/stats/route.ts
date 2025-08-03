import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Add caching for stats to prevent frequent database hits
const statsCache = new Map();
const STATS_CACHE_TTL = 60000; // 1 minute

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create cache key based on user
    const cacheKey = `stats-${session.user.id}-${session.user.role}-${session.user.departmentId}`;

    // Check cache first
    const cachedStats = statsCache.get(cacheKey);
    if (cachedStats && Date.now() - cachedStats.timestamp < STATS_CACHE_TTL) {
      console.log(`Returning cached stats for user: ${session.user.username}`);
      return NextResponse.json(cachedStats.result);
    }

    console.log(
      "Loading fresh stats for user:",
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

    const result = {
      stats,
      timestamp: new Date().toISOString(),
      user: {
        role: session.user.role,
        department: session.user.departmentName || null,
      },
    };

    // Cache the result
    statsCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    if (statsCache.size > 50) {
      const now = Date.now();
      for (const [key, value] of statsCache.entries()) {
        if (now - value.timestamp > STATS_CACHE_TTL * 2) {
          statsCache.delete(key);
        }
      }
    }

    return NextResponse.json(result);
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
