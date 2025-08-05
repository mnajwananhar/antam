import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { UserRole } from "@prisma/client";

// Utility function for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities
export const dateUtils = {
  formatDate: (date: Date | string): string => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, "dd/MM/yyyy");
  },

  formatDateTime: (date: Date | string): string => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, "dd/MM/yyyy HH:mm");
  },

  formatTime: (time: string | Date): string => {
    if (typeof time === "string") {
      return time;
    }
    return format(time, "HH:mm");
  },

  toISODate: (date: Date): string => {
    return format(date, "yyyy-MM-dd");
  },

  toISODateTime: (date: Date): string => {
    return date.toISOString();
  },

  getCurrentDate: (): string => {
    return format(new Date(), "yyyy-MM-dd");
  },

  getCurrentTime: (): string => {
    return format(new Date(), "HH:mm");
  },
};

// Role-based access control utilities
export const roleUtils = {
  canAccessAllDepartments: (role: UserRole): boolean => {
    return (
      [UserRole.ADMIN, UserRole.INPUTTER, UserRole.VIEWER] as UserRole[]
    ).includes(role);
  },

  canModifyData: (role: UserRole): boolean => {
    return (
      [UserRole.ADMIN, UserRole.PLANNER, UserRole.INPUTTER] as UserRole[]
    ).includes(role);
  },

  canDeleteData: (role: UserRole): boolean => {
    return role === UserRole.ADMIN;
  },

  canManageUsers: (role: UserRole): boolean => {
    return role === UserRole.ADMIN;
  },

  canApproveChanges: (role: UserRole): boolean => {
    return ([UserRole.ADMIN, UserRole.PLANNER] as UserRole[]).includes(role);
  },

  canAccessMaintenanceRoutine: (role: UserRole): boolean => {
    return ([UserRole.ADMIN, UserRole.PLANNER] as UserRole[]).includes(role);
  },

  requiresSingleSession: (role: UserRole): boolean => {
    return ([UserRole.ADMIN, UserRole.INPUTTER] as UserRole[]).includes(role);
  },

  getRoleDisplayName: (role: UserRole): string => {
    const roleNames = {
      [UserRole.ADMIN]: "Administrator",
      [UserRole.PLANNER]: "Planner",
      [UserRole.INPUTTER]: "Inputter",
      [UserRole.VIEWER]: "Viewer",
    };
    return roleNames[role];
  },
};

// Department utilities
export const departmentUtils = {
  isMtcEngBureau: (departmentName: string): boolean => {
    return (
      departmentName.toLowerCase().includes("mtc") &&
      departmentName.toLowerCase().includes("eng")
    );
  },

  getDepartmentCode: (departmentName: string): string => {
    // Extract department code from name or create one
    const codeMap: Record<string, string> = {
      "MTC&ENG Bureau": "MTCENG",
      MMTC: "MMTC",
      PMTC: "PMTC",
      ECDC: "ECDC",
      HETU: "HETU",
    };
    return (
      codeMap[departmentName] ||
      departmentName
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .substring(0, 6)
    );
  },

  /**
   * Convert department name to URL slug
   * @param departmentName - The department name to convert
   * @returns URL-safe slug
   */
  nameToSlug: (departmentName: string): string => {
    return departmentName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  },

  /**
   * Convert URL slug back to department name
   * @param slug - The URL slug to convert
   * @returns Department name
   */
  slugToName: (slug: string): string => {
    // Handle specific known department slugs for exact matching
    const slugMap: Record<string, string> = {
      "mtc-eng-bureau": "MTC&ENG Bureau",
      mmtc: "MMTC",
      pmtc: "PMTC",
      ecdc: "ECDC",
      hetu: "HETU",
    };

    return (
      slugMap[slug] ||
      // Fallback to generic conversion
      slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
        .replace(/And/g, "&")
    );
  },

  getAvailableFeatures: (departmentName: string): string[] => {
    if (departmentUtils.isMtcEngBureau(departmentName)) {
      return [
        "KPI_UTAMA",
        "CRITICAL_ISSUE",
        "SAFETY_INCIDENT",
        "ENERGY_IKES",
        "ENERGY_CONSUMPTION",
      ];
    }

    return ["EQUIPMENT_STATUS", "DAILY_ACTIVITY", "KTA_TTA", "CRITICAL_ISSUE"];
  },
};

// File handling utilities
export const fileUtils = {
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  getFileExtension: (filename: string): string => {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
  },

  isExcelFile: (filename: string): boolean => {
    const ext = fileUtils.getFileExtension(filename).toLowerCase();
    return ["xlsx", "xls"].includes(ext);
  },

  isCsvFile: (filename: string): boolean => {
    const ext = fileUtils.getFileExtension(filename).toLowerCase();
    return ext === "csv";
  },

  validateFileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  },

  validateFileSize: (file: File, maxSize: number): boolean => {
    return file.size <= maxSize;
  },
};

// Form utilities
export const formUtils = {
  resetFormErrors: (
    setError: (field: string, error: { message: string }) => void,
    fields: string[]
  ): void => {
    fields.forEach((field) => setError(field, { message: "" }));
  },

  formatFormData: (data: Record<string, unknown>): FormData => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    return formData;
  },

  parseFormDataToObject: (formData: FormData): Record<string, unknown> => {
    const object: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      object[key] = value;
    });
    return object;
  },
};

// Number and calculation utilities
export const numberUtils = {
  formatNumber: (num: number, decimals: number = 2): string => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  },

  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  },

  calculatePercentage: (value: number, total: number): number => {
    if (total === 0) return 0;
    return (value / total) * 100;
  },

  roundToDecimal: (num: number, decimals: number): number => {
    return (
      Math.round((num + Number.EPSILON) * Math.pow(10, decimals)) /
      Math.pow(10, decimals)
    );
  },
};

// Validation utilities
export const validationUtils = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPhoneNumber: (phone: string): boolean => {
    const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
    return phoneRegex.test(phone.replace(/[^0-9+]/g, ""));
  },

  isValidTime: (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  },

  isValidDate: (date: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  },
};

// API utilities
export const apiUtils = {
  handleApiError: (error: Error | unknown): string => {
    if (error && typeof error === "object" && "response" in error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      if (apiError.response?.data?.message) {
        return apiError.response.data.message;
      }
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return "An unexpected error occurred";
  },

  createApiResponse: <T>(data: T, message?: string) => {
    return Response.json({
      success: true,
      data,
      message: message || "Operation successful",
    });
  },

  createApiError: (message: string, status: number = 500) => {
    return Response.json(
      {
        success: false,
        error: message,
      },
      { status }
    );
  },
};

// Equipment utilities
export const equipmentUtils = {
  getEquipmentStatusColor: (status: string): string => {
    const statusColors = {
      WORKING: "text-green-600 bg-green-50",
      STANDBY: "text-yellow-600 bg-yellow-50",
      BREAKDOWN: "text-red-600 bg-red-50",
    };
    return (
      statusColors[status as keyof typeof statusColors] ||
      "text-gray-600 bg-gray-50"
    );
  },

  getEquipmentStatusBadgeColor: (status: string): string => {
    const badgeColors = {
      WORKING: "bg-green-100 text-green-800",
      STANDBY: "bg-yellow-100 text-yellow-800",
      BREAKDOWN: "bg-red-100 text-red-800",
    };
    return (
      badgeColors[status as keyof typeof badgeColors] ||
      "bg-gray-100 text-gray-800"
    );
  },
};
