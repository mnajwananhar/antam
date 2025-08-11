import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// Roles that should have single session (only one login at a time)
const SINGLE_SESSION_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.INPUTTER, UserRole.PLANNER];

export class SessionManager {
  /**
   * Validate if a user's session is still valid
   * Only applies to single-session roles (ADMIN, INPUTTER, PLANNER)
   * VIEWER can have multiple sessions
   */
  static async validateSession(userId: number, sessionToken?: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          role: true, 
          sessionToken: true,
          isActive: true 
        },
      });

      if (!user || !user.isActive) {
        return false;
      }

      // VIEWER can have multiple sessions, so always valid
      if (user.role === UserRole.VIEWER) {
        return true;
      }

      // For single-session roles, check if tokens match
      if (SINGLE_SESSION_ROLES.includes(user.role)) {
        return user.sessionToken === sessionToken;
      }

      return true;
    } catch (error) {
      console.error("Session validation error:", error);
      return false;
    }
  }

  /**
   * Invalidate all sessions for a user (force logout from all devices)
   */
  static async invalidateUserSessions(userId: number): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { sessionToken: null },
      });
    } catch (error) {
      console.error("Error invalidating user sessions:", error);
    }
  }

  /**
   * Get session info for debugging
   */
  static async getSessionInfo(userId: number) {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          role: true,
          sessionToken: true,
          lastLogin: true,
          isActive: true,
        },
      });
    } catch (error) {
      console.error("Error getting session info:", error);
      return null;
    }
  }
}