export interface NotificationBase {
  id: number;
  uniqueNumber: string;
  reportTime: string;
  urgency: "NORMAL" | "URGENT" | "EMERGENCY";
  problemDetail: string;
  status: "PROCESS" | "COMPLETE";
  type: "PREM" | "CORM";
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationWithRelations extends NotificationBase {
  department: {
    id: number;
    name: string;
    code: string;
  };
  createdBy: {
    id: number;
    username: string;
    role: string;
  };
  orders: {
    id: number;
    jobName: string;
    startDate: Date;
    endDate?: Date | null;
  }[];
}

export interface NotificationWithFullOrders
  extends Omit<NotificationWithRelations, "orders"> {
  orders: OrderWithRelations[];
}

export interface NotificationStats {
  total: number;
  inProcess: number;
  completed: number;
  emergency: number;
}

export interface OrderBase {
  id: number;
  jobName: string;
  startDate: Date;
  endDate?: Date | null;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderActivity {
  id: number;
  activity: string;
  object: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderWithRelations extends OrderBase {
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
  activities: OrderActivity[];
}

export interface OrderWithProgress extends OrderWithRelations {
  progress: number;
  totalActivities: number;
  completedActivities: number;
}

export interface OrderStats {
  total: number;
  inProgress: number;
  completed: number;
  averageProgress: number;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: number;
  username: string;
  role: "ADMIN" | "PLANNER" | "INPUTTER" | "VIEWER";
  departmentId?: number | null;
  isActive: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  pagination?: PaginationInfo;
  stats?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export interface AuthSession {
  user: {
    id: string;
    username: string;
    role: string;
    departmentId?: number;
  };
}
