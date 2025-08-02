import { z } from "zod";

export const createNotificationSchema = z.object({
  departmentId: z.number().int().positive("Department ID tidak valid"),
  reportTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format waktu tidak valid (HH:MM)"),
  urgency: z.enum(["NORMAL", "URGENT", "EMERGENCY"], {
    errorMap: () => ({ message: "Tingkat urgensi harus NORMAL, URGENT, atau EMERGENCY" }),
  }),
  problemDetail: z.string().min(10, "Detail masalah minimal 10 karakter").max(1000, "Detail masalah maksimal 1000 karakter"),
});

export const updateNotificationSchema = z.object({
  departmentId: z.number().int().positive("Department ID tidak valid").optional(),
  reportTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format waktu tidak valid (HH:MM)").optional(),
  urgency: z.enum(["NORMAL", "URGENT", "EMERGENCY"], {
    errorMap: () => ({ message: "Tingkat urgensi harus NORMAL, URGENT, atau EMERGENCY" }),
  }).optional(),
  problemDetail: z.string().min(10, "Detail masalah minimal 10 karakter").max(1000, "Detail masalah maksimal 1000 karakter").optional(),
  status: z.enum(["PROCESS", "COMPLETE"], {
    errorMap: () => ({ message: "Status harus PROCESS atau COMPLETE" }),
  }).optional(),
});

export const notificationQuerySchema = z.object({
  departmentId: z.string().regex(/^\d+$/, "Department ID harus berupa angka").optional(),
  status: z.enum(["PROCESS", "COMPLETE"]).optional(),
  urgency: z.enum(["NORMAL", "URGENT", "EMERGENCY"]).optional(),
  page: z.string().regex(/^\d+$/, "Page harus berupa angka").optional(),
  limit: z.string().regex(/^\d+$/, "Limit harus berupa angka").optional(),
});

export const notificationIdSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID tidak valid"),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
export type NotificationIdInput = z.infer<typeof notificationIdSchema>;
