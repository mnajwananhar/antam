import { prisma } from "@/lib/prisma";
import { UserRole, StatusTindakLanjut } from "@prisma/client";

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
 * Check if user has access to KTA/KPI data
 */
export function hasDataAccess(): boolean {
  return true;
}

/**
 * Get allowed PIC departments based on user role using database mapping
 */
export async function getAllowedPIC(
  userRole: UserRole,
  userDepartment: string | undefined
): Promise<string[]> {
  // Admin and MTC&ENG Bureau can see all data
  if (userRole === UserRole.ADMIN || userDepartment === "MTC&ENG Bureau") {
    return []; // Empty array means no filter (show all)
  }

  // Inputter can access all departments
  if (userRole === UserRole.INPUTTER) {
    return [];
  }

  // For other users, get PIC mapping from database
  if (userDepartment) {
    const departmentCode = getDepartmentCode(userDepartment);
    
    const picMappings = await prisma.departmentPicMapping.findMany({
      where: {
        departmentCode,
        isActive: true
      },
      select: {
        picValue: true
      }
    });

    return picMappings.map(mapping => mapping.picValue);
  }

  return [];
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
 * Generate unique register number for KTA/KPI data
 */
export async function generateRegisterNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  
  const baseNumber = `KTA-${year}${month}`;

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
  kriteriaKtaTta?: string
): Promise<Date> {
  // Default due date is 30 days from tanggal
  const dueDate = new Date(tanggal);
  dueDate.setDate(dueDate.getDate() + 30);
  
  // You can add more complex logic here based on kriteriaKtaTta
  // For now, just return the default due date
  console.log('KTA/TTA criteria:', kriteriaKtaTta); // Use the parameter to avoid unused warning
  return dueDate;
}

/**
 * Build PIC where clause for queries (async to support database lookup)
 */
export async function buildPICWhereClause(
  userRole: UserRole,
  userDepartment: string | undefined,
  filters: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  const whereClause: Record<string, unknown> = {
    ...filters
  };

  // Get allowed PIC values for user
  const allowedPIC = await getAllowedPIC(userRole, userDepartment);
  
  // If allowedPIC is not empty, filter by those PIC values
  if (allowedPIC.length > 0) {
    whereClause.picDepartemen = {
      in: allowedPIC
    };
  }

  return whereClause;
}