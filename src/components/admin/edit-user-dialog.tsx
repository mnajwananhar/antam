"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToastContext } from "@/components/providers/toast-provider";
import { Edit, Save, X } from "lucide-react";
import { z } from "zod";
import { USER_ROLE_OPTIONS } from "@/lib/constants";
import { UserRole } from "@prisma/client";
import type { User, Department } from "@prisma/client";

const editUserSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  role: z.nativeEnum(UserRole),
  departmentId: z.number().min(1, "Departemen harus dipilih"),
  isActive: z.boolean(),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "Password minimal 6 karakter jika diisi",
    }),
});

type EditUserInput = z.infer<typeof editUserSchema>;

interface UserWithDepartment extends User {
  department: Department | null;
}

interface EditUserDialogProps {
  user: UserWithDepartment | null;
  departments: Department[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({
  user,
  departments,
  open,
  onOpenChange,
}: EditUserDialogProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // ✅ MENGGUNAKAN TOAST SYSTEM
  const { showError, showSuccess } = useToastContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EditUserInput>({
    resolver: zodResolver(editUserSchema),
  });

  const selectedRole = watch("role");

  // Set form values when user changes
  useEffect(() => {
    if (user) {
      setValue("username", user.username);
      setValue("role", user.role);
      setValue("departmentId", user.departmentId || 1);
      setValue("isActive", user.isActive);
    }
  }, [user, setValue]);

  const onSubmit = async (data: EditUserInput): Promise<void> => {
    if (!user) return;

    setIsLoading(true);

    try {
      console.log("Updating user with data:", {
        userId: user.id,
        ...data,
      });

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log("Update user response:", result);

      if (!response.ok) {
        throw new Error(result.error || "Gagal mengupdate pengguna");
      }

      // Success - show success toast, close dialog and refresh page
      showSuccess(`Pengguna "${data.username}" berhasil diupdate`);
      onOpenChange(false);
      reset();
      router.refresh();
    } catch (err) {
      console.error("Error updating user:", err);
      showError(
        err instanceof Error ? err.message : "Terjadi kesalahan sistem"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = (): void => {
    onOpenChange(false);
    reset();
  };

  if (!user) return <></>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Pengguna
          </DialogTitle>
          <DialogDescription>
            Ubah informasi pengguna &quot;{user.username}&quot;. Pastikan semua
            data sudah benar sebelum menyimpan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Username */}
          <div className="space-y-2">
            <Input
              label="Username"
              placeholder="Masukkan username"
              error={errors.username?.message}
              {...register("username")}
            />
            <p className="text-xs text-muted-foreground">
              Username harus unik dan minimal 3 karakter
            </p>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Input
              label="Password Baru"
              type="password"
              placeholder="Kosongkan jika tidak ingin mengubah password"
              error={errors.password?.message}
              {...register("password")}
            />
            <p className="text-xs text-muted-foreground">
              Minimal 6 karakter. Kosongkan jika tidak ingin mengubah password.
            </p>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setValue("role", value as UserRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center gap-2">
                      <span>{role.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>

          {/* Department - Only show for non-admin roles */}
          {selectedRole !== UserRole.ADMIN && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Departemen</label>
              <Select
                value={watch("departmentId")?.toString()}
                onValueChange={(value) =>
                  setValue("departmentId", parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih departemen" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{dept.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({dept.code})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departmentId && (
                <p className="text-sm text-red-500">
                  {errors.departmentId.message}
                </p>
              )}
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={watch("isActive") ? "true" : "false"}
              onValueChange={(value) => setValue("isActive", value === "true")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Aktif</span>
                  </div>
                </SelectItem>
                <SelectItem value="false">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Tidak Aktif</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleDialogClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
