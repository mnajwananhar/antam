import { z } from "zod";
import { UserRole, EquipmentStatus } from "@prisma/client";

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password confirmation is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// User management schemas
export const createUserSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must be less than 50 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.nativeEnum(UserRole),
    departmentId: z.number().optional(),
  })
  .refine(
    (data) => {
      // If role is PLANNER, departmentId is required
      if (data.role === UserRole.PLANNER) {
        return data.departmentId !== undefined;
      }
      return true;
    },
    {
      message: "Departemen wajib dipilih untuk role Planner",
      path: ["departmentId"],
    }
  );

export const updateUserSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must be less than 50 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
    role: z.nativeEnum(UserRole),
    departmentId: z.number().optional(),
    isActive: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.role === UserRole.PLANNER) {
        return data.departmentId !== undefined;
      }
      return true;
    },
    {
      message: "Departemen harus diisi untuk role Planner",
      path: ["departmentId"],
    }
  );

// Equipment status schema
export const equipmentStatusSchema = z.object({
  equipmentId: z.number(),
  status: z.nativeEnum(EquipmentStatus),
});

export const bulkEquipmentStatusSchema = z.object({
  updates: z.array(equipmentStatusSchema),
});

export type BulkEquipmentStatusInput = z.infer<
  typeof bulkEquipmentStatusSchema
>;

// Operational report schemas
export const operationalReportBaseSchema = z.object({
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  equipmentId: z.number(),
  departmentId: z.number(),
  totalWorking: z.number().min(0).max(24),
  totalStandby: z.number().min(0).max(24),
  totalBreakdown: z.number().min(0).max(24),
  shiftType: z.string().min(1, "Shift type is required"),
  notes: z.string().optional(),
});

export const operationalReportSchema = operationalReportBaseSchema.refine(
  (data) => {
    const total = data.totalWorking + data.totalStandby + data.totalBreakdown;
    return total <= 24;
  },
  {
    message: "Total hours cannot exceed 24",
    path: ["totalWorking"],
  }
);

export const activityDetailSchema = z.object({
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format")
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format")
    .optional(),
  maintenanceType: z.string().optional(),
  description: z.string().optional(),
  status: z.nativeEnum(EquipmentStatus),
});

export const operationalReportWithActivitiesSchema =
  operationalReportBaseSchema.extend({
    activityDetails: z.array(activityDetailSchema),
  });

// KTA/KPI data schemas
export const ktaKpiDataSchema = z.object({
  noRegister: z.string().optional(),
  nppPelapor: z.string().min(1, "NPP Pelapor is required"),
  namaPelapor: z.string().min(1, "Nama Pelapor is required"),
  perusahaanBiro: z.string().optional(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  lokasi: z.string().optional(),
  areaTemuan: z.string().optional(),
  keterangan: z.string().optional(),
  fotoUrl: z.string().url().optional().or(z.literal("")),
  kategori: z.string().optional(),
  sumberTemuan: z.string().optional(),
  picDepartemen: z.string().min(1, "PIC Departemen is required"),
  kriteriaKtaTta: z.string().optional(),
  perusahaanPengelola: z.string().optional(),
  tindakLanjutLangsung: z.string().optional(),
  statusTindakLanjut: z.string().optional(),
  biro: z.string().optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional(),
  updateStatus: z.string().optional(),
});

export const bulkKtaKpiDataSchema = z.object({
  data: z.array(ktaKpiDataSchema),
});

// Maintenance routine schemas
export const maintenanceActivitySchema = z.object({
  activity: z.string().min(1, "Activity is required"),
  object: z.string().min(1, "Object is required"),
});

export const maintenanceRoutineSchema = z.object({
  jobName: z.string().min(1, "Job name is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional(),
  description: z.string().optional(),
  departmentId: z.number(),
  activities: z.array(maintenanceActivitySchema),
});

// Critical issue schema
export const criticalIssueSchema = z.object({
  issueName: z.string().min(1, "Nama masalah wajib diisi"),
  departmentId: z.number(),
  status: z.nativeEnum(EquipmentStatus),
  description: z
    .string()
    .min(5, "Deskripsi minimal 5 karakter")
    .max(500, "Deskripsi maksimal 500 karakter"),
});

// Safety incident schema (MTC&ENG Bureau only)
export const safetyIncidentSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
  nearmiss: z.number().min(0),
  kecAlat: z.number().min(0),
  kecKecil: z.number().min(0),
  kecRingan: z.number().min(0),
  kecBerat: z.number().min(0),
  fatality: z.number().min(0),
});

// Energy schemas (MTC&ENG Bureau only)
export const energyTargetSchema = z.object({
  year: z.number().min(2020).max(2030),
  month: z.number().min(1).max(12),
  ikesTarget: z.number().optional(),
  emissionTarget: z.number().optional(),
});

export const energyRealizationSchema = z.object({
  year: z.number().min(2020).max(2030),
  month: z.number().min(1).max(12),
  ikesRealization: z.number().optional(),
  emissionRealization: z.number().optional(),
});

export const energyConsumptionSchema = z.object({
  year: z.number().min(2020).max(2030),
  month: z.number().min(1).max(12),
  plnConsumption: z.number().min(0),
  tambangConsumption: z.number().min(0),
  pabrikConsumption: z.number().min(0),
  supportingConsumption: z.number().min(0),
});

// Search and filter schemas
export const searchSchema = z.object({
  query: z.string().optional(),
  department: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

// File upload schema
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(10 * 1024 * 1024), // 10MB
  allowedTypes: z
    .array(z.string())
    .default([
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ]),
});

// Type exports for better TypeScript support
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type OperationalReportInput = z.infer<typeof operationalReportSchema>;
export type KtaKpiDataInput = z.infer<typeof ktaKpiDataSchema>;
export type MaintenanceRoutineInput = z.infer<typeof maintenanceRoutineSchema>;
export type CriticalIssueInput = z.infer<typeof criticalIssueSchema>;
export type SafetyIncidentInput = z.infer<typeof safetyIncidentSchema>;
export type EnergyTargetInput = z.infer<typeof energyTargetSchema>;
export type EnergyRealizationInput = z.infer<typeof energyRealizationSchema>;
export type EnergyConsumptionInput = z.infer<typeof energyConsumptionSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
