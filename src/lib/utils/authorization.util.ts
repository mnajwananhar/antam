import { auth } from "@/lib/auth";

export interface AuthSession {
  user: {
    id: string;
    username: string;
    role: string;
    departmentId?: number;
  };
}

export class AuthorizationUtil {
  static async requireAuth(): Promise<AuthSession | never> {
    const session = await auth();

    if (!session) {
      throw new Error("Unauthorized");
    }

    return session as AuthSession;
  }

  static requireRole(session: AuthSession, allowedRoles: string[]): void {
    if (!allowedRoles.includes(session.user.role)) {
      throw new Error("Insufficient permissions");
    }
  }

  static requireAdminRole(session: AuthSession): void {
    this.requireRole(session, ["ADMIN"]);
  }

  static requirePlannerOrAbove(session: AuthSession): void {
    this.requireRole(session, ["ADMIN", "PLANNER"]);
  }

  static requireInputterOrAbove(session: AuthSession): void {
    this.requireRole(session, ["ADMIN", "PLANNER", "INPUTTER"]);
  }

  static canAccessDepartment(
    session: AuthSession,
    departmentId: number
  ): boolean {
    // Admin can access all departments
    if (session.user.role === "ADMIN") {
      return true;
    }

    // Inputter can access all departments
    if (session.user.role === "INPUTTER") {
      return true;
    }

    // Planner can only access their own department
    if (session.user.role === "PLANNER" && session.user.departmentId) {
      return session.user.departmentId === departmentId;
    }

    // Viewer can see all departments (read-only)
    if (session.user.role === "VIEWER") {
      return true;
    }

    return false;
  }

  static requireDepartmentAccess(
    session: AuthSession,
    departmentId: number
  ): void {
    if (!this.canAccessDepartment(session, departmentId)) {
      throw new Error("Access denied to this department");
    }
  }

  static canCreateInDepartment(
    session: AuthSession,
    departmentId: number
  ): boolean {
    // Admin can create in all departments
    if (session.user.role === "ADMIN") {
      return true;
    }

    // Inputter can create in all departments
    if (session.user.role === "INPUTTER") {
      return true;
    }

    // Planner can only create in their own department
    if (session.user.role === "PLANNER" && session.user.departmentId) {
      return session.user.departmentId === departmentId;
    }

    return false;
  }

  static requireCreatePermission(
    session: AuthSession,
    departmentId: number
  ): void {
    if (!this.canCreateInDepartment(session, departmentId)) {
      throw new Error("No permission to create in this department");
    }
  }

  static canModifyResource(
    session: AuthSession,
    resourceDepartmentId: number,
    resourceCreatorId?: number
  ): boolean {
    // Admin can modify everything
    if (session.user.role === "ADMIN") {
      return true;
    }

    // Planner can modify resources in their department
    if (session.user.role === "PLANNER" && session.user.departmentId) {
      return session.user.departmentId === resourceDepartmentId;
    }

    // Inputter can modify resources they created in any department
    if (session.user.role === "INPUTTER" && resourceCreatorId) {
      return parseInt(session.user.id) === resourceCreatorId;
    }

    return false;
  }

  static requireModifyPermission(
    session: AuthSession,
    resourceDepartmentId: number,
    resourceCreatorId?: number
  ): void {
    if (
      !this.canModifyResource(session, resourceDepartmentId, resourceCreatorId)
    ) {
      throw new Error("No permission to modify this resource");
    }
  }

  static canDeleteResource(session: AuthSession): boolean {
    // Only admin can delete resources
    return session.user.role === "ADMIN";
  }

  static requireDeletePermission(session: AuthSession): void {
    if (!this.canDeleteResource(session)) {
      throw new Error("Only admin can delete resources");
    }
  }

  static getPaginationParams(searchParams: URLSearchParams) {
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "10"))
    );

    return { page, limit };
  }

  static getFilterParams(
    searchParams: URLSearchParams,
    allowedFilters: string[]
  ) {
    const filters: Record<string, string> = {};

    for (const filter of allowedFilters) {
      const value = searchParams.get(filter);
      if (value !== null && value.trim() !== "") {
        filters[filter] = value.trim();
      }
    }

    return filters;
  }
}
