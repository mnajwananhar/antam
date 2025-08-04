"use client";

import { useState } from "react";
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
  DialogTrigger,
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
import { UserPlus } from "lucide-react";
import { createUserSchema, type CreateUserInput } from "@/lib/validations";
import { USER_ROLE_OPTIONS } from "@/lib/constants";
import { UserRole } from "@prisma/client";
import type { Department } from "@prisma/client";

interface CreateUserDialogProps {
  children: React.ReactNode;
  departments: Department[];
}

export function CreateUserDialog({
  children,
  departments,
}: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // ✅ MENGGUNAKAN TOAST SYSTEM
  const { showError, showSuccess } = useToastContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: "VIEWER",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: CreateUserInput) => {
    setIsLoading(true);

    try {
      console.log("Creating user with data:", {
        ...data,
        password: "[HIDDEN]",
      });

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log("Create user response:", result);

      if (!response.ok) {
        throw new Error(result.error || "Gagal membuat pengguna baru");
      }

      // Success - show success toast, close dialog and refresh page
      showSuccess(`Pengguna "${data.username}" berhasil dibuat`);
      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      console.error("Error creating user:", err);
      showError(
        err instanceof Error ? err.message : "Terjadi kesalahan sistem"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Tambah Pengguna Baru
          </DialogTitle>
          <DialogDescription>
            Buat akun pengguna baru dengan role dan akses yang sesuai
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
              label="Password"
              type="password"
              placeholder="Masukkan password"
              error={errors.password?.message}
              {...register("password")}
            />
            <p className="text-xs text-muted-foreground">
              Password minimal 6 karakter
            </p>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Role <span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setValue("role", value as UserRole)}
            >
              <SelectTrigger error={errors.role?.message}>
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>

          {/* Department (conditional) */}
          {selectedRole === "PLANNER" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Departemen <span className="text-red-500">*</span>
              </label>
              <Select
                onValueChange={(value) =>
                  setValue("departmentId", parseInt(value))
                }
              >
                <SelectTrigger error={errors.departmentId?.message}>
                  <SelectValue placeholder="Pilih departemen" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departmentId && (
                <p className="text-sm text-red-500">
                  {errors.departmentId.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Planner hanya dapat mengakses departemen yang ditugaskan
              </p>
            </div>
          )}

          {/* Role Information */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Informasi Role:
            </h4>
            <div className="text-xs text-blue-700">
              {selectedRole === "ADMIN" && (
                <p>
                  Administrator memiliki akses penuh ke semua fitur dan
                  departemen
                </p>
              )}
              {selectedRole === "PLANNER" && (
                <p>
                  Planner dapat mengelola data untuk departemen yang ditugaskan
                </p>
              )}
              {selectedRole === "INPUTTER" && (
                <p>Inputter dapat menginput data untuk semua departemen</p>
              )}
              {selectedRole === "VIEWER" && (
                <p>Viewer hanya dapat melihat data tanpa akses edit</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleDialogClose}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" loading={isLoading} disabled={isLoading}>
              {isLoading ? "Membuat..." : "Buat Pengguna"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
