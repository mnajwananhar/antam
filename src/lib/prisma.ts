import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    errorFormat: "pretty",
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Database utility functions
export const dbUtils = {
  /**
   * Generate unique number for notifications and maintenance
   */
  generateUniqueNumber: (
    departmentCode: string,
    date: Date,
    sequence: number
  ): string => {
    const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
    const sequenceStr = sequence.toString().padStart(3, "0");
    return `${departmentCode}-${dateStr}-${sequenceStr}`;
  },

  /**
   * Get next sequence number for unique number generation
   */
  getNextSequenceNumber: async (
    table: "notification" | "maintenanceRoutine",
    departmentCode: string,
    date: Date
  ): Promise<number> => {
    const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");

    let count: number;

    if (table === "notification") {
      count = await prisma.notification.count({
        where: {
          uniqueNumber: {
            startsWith: `${departmentCode}-${dateStr}-`,
          },
        },
      });
    } else {
      count = await prisma.maintenanceRoutine.count({
        where: {
          uniqueNumber: {
            startsWith: `${departmentCode}-${dateStr}-`,
          },
        },
      });
    }

    return count + 1;
  },

  /**
   * Check if user has access to specific department
   */
  checkDepartmentAccess: async (
    userId: number,
    departmentId: number
  ): Promise<boolean> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, departmentId: true },
    });

    if (!user) return false;

    // Admin and Inputter have global access
    if (user.role === "ADMIN" || user.role === "INPUTTER") {
      return true;
    }

    // Planner only has access to their department
    if (user.role === "PLANNER") {
      return user.departmentId === departmentId;
    }

    // Viewer has read-only access to all departments
    if (user.role === "VIEWER") {
      return true;
    }

    return false;
  },

  /**
   * Get user with department info
   */
  getUserWithDepartment: async (userId: number) => {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  },

  /**
   * Get departments accessible by user
   */
  getAccessibleDepartments: async (userId: number) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, departmentId: true },
    });

    if (!user) return [];

    // Admin, Inputter, and Viewer can access all departments
    if (
      user.role === "ADMIN" ||
      user.role === "INPUTTER" ||
      user.role === "VIEWER"
    ) {
      return await prisma.department.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });
    }

    // Planner can only access their department
    if (user.role === "PLANNER" && user.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: user.departmentId, isActive: true },
      });
      return department ? [department] : [];
    }

    return [];
  },
};
