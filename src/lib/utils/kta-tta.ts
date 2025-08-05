import { prisma } from "@/lib/prisma";
import { UserRole, DataType, StatusTindakLanjut } from "@prisma/client";

/**
 * Calculate update status based on due date and status tindak lanjut
 */
export function calculateUpdateStatus(
  dueDate: Date | null,
  statusTindakLanjut: StatusTindakLanjut | null
): string {
  if (!dueDate || !statusTindakLanjut) {
    return "Proses";
  }

  if (statusTindakLanjut === "CLOSE") {
    return "Close";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDateOnly = new Date(dueDate);
  dueDateOnly.setHours(0, 0, 0, 0);

  if (dueDateOnly < today) {
    return "Due Date";
  }

  return "Proses";
}

/**
 * Check if user has access to specific data type
 */
export function hasDataTypeAccess(
  userRole: UserRole,
  userDepartment: string | undefined,
  dataType: DataType
): boolean {
  // Admin has access to everything
  if (userRole === UserRole.ADMIN) {
    return true;
  }

  // Inputter has access to everything
  if (userRole === UserRole.INPUTTER) {
    return true;
  }

  // Planner access rules
  if (userRole === UserRole.PLANNER) {
    // KPI_UTAMA is only for MTC&ENG Bureau
    if (dataType === DataType.KPI_UTAMA) {
      return userDepartment === "MTC&ENG Bureau";
    }
    
    // KTA_TTA is for all departments except MTC&ENG Bureau
    if (dataType === DataType.KTA_TTA) {
      return userDepartment !== "MTC&ENG Bureau";
    }
  }

  // Viewer has read-only access to everything
  if (userRole === UserRole.VIEWER) {
    return true;
  }

  return false;
}

/**
 * Get allowed PIC departments based on user role and data type
 */
export function getAllowedPIC(
  userRole: UserRole,
  userDepartment: string | undefined,
  dataType: DataType
): string[] {
  const allDepartments = [
    "MTC&ENG Bureau",
    "MMTC", 
    "PMTC",
    "ECDC",
    "HETU"
  ];

  // Admin and users from MTC&ENG Bureau can access all departments for KPI_UTAMA
  if (userRole === UserRole.ADMIN || userDepartment === "MTC&ENG Bureau") {
    if (dataType === DataType.KPI_UTAMA) {
      return allDepartments;
    }
  }

  // Inputter can access all departments
  if (userRole === UserRole.INPUTTER) {
    return allDepartments;
  }

  // Planner can only access their own department for KTA_TTA
  if (userRole === UserRole.PLANNER && userDepartment) {
    if (dataType === DataType.KTA_TTA) {
      return [userDepartment];
    }
  }

  // Default case
  if (userDepartment) {
    return [userDepartment];
  }

  return allDepartments;
}

/**
 * Initialize default KTA/TTA criteria
 */
export async function initializeDefaultKriteria(): Promise<void> {
  const defaultKriteria = [
    "Kebersihan area kerja",
    "Penggunaan APD lengkap",
    "Kondisi peralatan kerja",
    "Prosedur kerja sesuai SOP",
    "Housekeeping area kerja",
    "Pengelolaan limbah",
    "Kondisi akses jalan",
    "Sistem pencahayaan",
    "Ventilasi area kerja",
    "Kondisi emergency exit"
  ];

  try {
    // Check if criteria already exist
    const existingCount = await prisma.kriteriaKtaTta.count();
    
    if (existingCount === 0) {
      // Insert default criteria
      await prisma.kriteriaKtaTta.createMany({
        data: defaultKriteria.map(kriteria => ({
          kriteria,
          isActive: true
        })),
        skipDuplicates: true
      });
    }
  } catch (error) {
    console.error("Error initializing default criteria:", error);
    throw new Error("Failed to initialize default criteria");
  }
}

/**
 * Validate KTA/TTA data
 */
export function validateKtaData(data: Record<string, unknown>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.nppPelapor) {
    errors.push("NPP Pelapor is required");
  }

  if (!data.namaPelapor) {
    errors.push("Nama Pelapor is required");
  }

  if (!data.tanggal) {
    errors.push("Tanggal is required");
  }

  if (!data.lokasi) {
    errors.push("Lokasi is required");
  }

  if (!data.keterangan) {
    errors.push("Keterangan is required");
  }

  if (!data.picDepartemen) {
    errors.push("PIC Departemen is required");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate unique register number for KTA/TTA
 */
export async function generateRegisterNumber(dataType: DataType): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  
  const prefix = dataType === DataType.KTA_TTA ? "KTA" : "KPI";
  const baseNumber = `${prefix}-${year}${month}`;

  // Count existing records with similar pattern
  const existingCount = await prisma.ktaKpiData.count({
    where: {
      noRegister: {
        startsWith: baseNumber
      }
    }
  });

  const sequenceNumber = String(existingCount + 1).padStart(4, "0");
  return `${baseNumber}-${sequenceNumber}`;
}

/**
 * Department mapping utilities
 */
export const departmentMapping = {
  "MTC&ENG Bureau": "MTCENG",
  "MMTC": "MMTC",
  "PMTC": "PMTC", 
  "ECDC": "ECDC",
  "HETU": "HETU"
} as const;

export function getDepartmentCode(departmentName: string): string {
  return departmentMapping[departmentName as keyof typeof departmentMapping] || "UNKNOWN";
}

export function getDepartmentName(departmentCode: string): string {
  const entry = Object.entries(departmentMapping).find(([, code]) => code === departmentCode);
  return entry ? entry[0] : departmentCode;
}

/**
 * Clean kriteria KTA/TTA string
 */
export function cleanKriteriaKtaTta(kriteria: string): string {
  if (!kriteria) return "";
  
  return kriteria
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s&-]/g, "");
}

/**
 * Calculate due date based on tanggal and kriteria
 */
export async function calculateDueDate(
  tanggal: Date,
  _kriteriaKtaTta: string
): Promise<Date> {
  // Default due date is 30 days from tanggal
  const dueDate = new Date(tanggal);
  dueDate.setDate(dueDate.getDate() + 30);
  
  // You can add more complex logic here based on kriteria
  // For now, just return the default due date
  return dueDate;
}

/**
 * Build PIC where clause for queries
 */
export function buildPICWhereClause(
  userRole: UserRole,
  userDepartment: string | undefined,
  dataType: DataType,
  filters: Record<string, unknown> = {}
): Record<string, unknown> {
  const whereClause: Record<string, unknown> = {
    dataType,
    ...filters
  };

  // Role-based filtering
  if (userRole === UserRole.PLANNER && userDepartment) {
    if (dataType === DataType.KTA_TTA) {
      whereClause.picDepartemen = userDepartment;
    }
  }

  return whereClause;
}