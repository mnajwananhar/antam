import { z } from "zod";

const orderActivitySchema = z.object({
  activity: z.string().min(1, "Aktivitas wajib diisi").max(255, "Aktivitas maksimal 255 karakter"),
  object: z.string().min(1, "Object wajib diisi").max(255, "Object maksimal 255 karakter"),
  isCompleted: z.boolean().default(false),
});

const orderActivityUpdateSchema = orderActivitySchema.extend({
  id: z.number().int().positive().optional(),
});

export const createOrderSchema = z.object({
  notificationId: z.number().int().positive("Notification ID tidak valid"),
  jobName: z.string().min(1, "Nama pekerjaan wajib diisi").max(255, "Nama pekerjaan maksimal 255 karakter"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)").optional(),
  description: z.string().max(1000, "Deskripsi maksimal 1000 karakter").optional(),
  activities: z.array(orderActivitySchema).optional().default([]),
}).refine((data) => {
  if (data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return endDate > startDate;
  }
  return true;
}, {
  message: "Tanggal selesai harus setelah tanggal mulai",
  path: ["endDate"],
});

export const updateOrderSchema = z.object({
  jobName: z.string().min(1, "Nama pekerjaan wajib diisi").max(255, "Nama pekerjaan maksimal 255 karakter").optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)").optional(),
  description: z.string().max(1000, "Deskripsi maksimal 1000 karakter").optional(),
  activities: z.array(orderActivityUpdateSchema).optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return endDate > startDate;
  }
  return true;
}, {
  message: "Tanggal selesai harus setelah tanggal mulai",
  path: ["endDate"],
});

export const orderQuerySchema = z.object({
  notificationId: z.string().regex(/^\d+$/, "Notification ID harus berupa angka").optional(),
  search: z.string().min(1).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "startDate", "endDate", "jobName", "progress", "departmentName"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  status: z.enum(["pending", "inProgress", "completed"]).optional(),
  page: z.string().regex(/^\d+$/, "Page harus berupa angka").optional(),
  limit: z.string().regex(/^\d+$/, "Limit harus berupa angka").optional(),
});

export const orderIdSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID tidak valid"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type OrderIdInput = z.infer<typeof orderIdSchema>;
export type OrderActivityInput = z.infer<typeof orderActivitySchema>;
export type OrderActivityUpdateInput = z.infer<typeof orderActivityUpdateSchema>;
