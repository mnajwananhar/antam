"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStandardFeedback } from "@/lib/hooks/use-standard-feedback";
import { EditUserDialog } from "@/components/admin/edit-user-dialog";
import { MoreHorizontal, Edit, Search, UserCheck, UserX } from "lucide-react";
import { roleUtils, dateUtils } from "@/lib/utils";
import { USER_ROLE_OPTIONS } from "@/lib/constants";
import type { User, Department } from "@prisma/client";

interface UserWithDepartment extends User {
  department: Department | null;
}

interface UserManagementTableProps {
  users: UserWithDepartment[];
  departments: Department[];
  currentUser: {
    id: string;
    username: string;
    role: string;
  };
}

export function UserManagementTable({
  users,
  departments,
  currentUser,
}: UserManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [editUser, setEditUser] = useState<UserWithDepartment | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const router = useRouter();

  // ✅ MENGGUNAKAN TOAST SYSTEM
  const { feedback, ConfirmationComponent } = useStandardFeedback();

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleEditUser = (user: UserWithDepartment): void => {
    setEditUser(user);
    setEditDialogOpen(true);
  };

  const handleToggleStatus = async (
    userId: number,
    username: string,
    currentStatus: boolean
  ) => {
    const action = currentStatus ? "menonaktifkan" : "mengaktifkan";
    const confirmed = await feedback.confirm({
      title: "Konfirmasi",
      message: `Apakah Anda yakin ingin ${action} pengguna "${username}"?`,
      variant: currentStatus ? "destructive" : "default"
    });
    if (!confirmed) return;

    setIsLoading(true);

    try {
      console.log("Toggling user status:", {
        userId,
        username,
        newStatus: !currentStatus,
      });

      const response = await fetch("/api/admin/users/toggle-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, isActive: !currentStatus }),
      });

      const result = await response.json();
      console.log("Toggle status response:", result);

      if (!response.ok) {
        throw new Error(result.error || "Gagal mengubah status pengguna");
      }

      feedback.success(`Status pengguna "${username}" berhasil diubah`);

      // Refresh the page to get updated data
      router.refresh();
    } catch (error) {
      console.error("Error toggling user status:", error);
      feedback.error(
        error instanceof Error ? error.message : "Terjadi kesalahan sistem"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      ADMIN: "destructive",
      PLANNER: "success",
      INPUTTER: "warning",
      VIEWER: "info",
    };
    return colors[role as keyof typeof colors] || "secondary";
  };

  const canManageUser = (targetUser: UserWithDepartment): boolean => {
    // Admin can manage all users except themselves
    if (currentUser.role === "ADMIN") {
      return targetUser.id.toString() !== currentUser.id;
    }
    return false;
  };

  return (
    <div className="space-y-4">
      {/* Filters - Responsive */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cari pengguna atau departemen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Semua Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                {USER_ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground text-center sm:text-left">
          Menampilkan {filteredUsers.length} dari {users.length} pengguna
        </div>
      </div>

      {/* Table - Responsive with horizontal scroll */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Username</TableHead>
              <TableHead className="min-w-[80px]">Role</TableHead>
              <TableHead className="min-w-[120px] hidden sm:table-cell">Departemen</TableHead>
              <TableHead className="min-w-[80px]">Status</TableHead>
              <TableHead className="min-w-[120px] hidden md:table-cell">Last Login</TableHead>
              <TableHead className="min-w-[100px] hidden lg:table-cell">Created</TableHead>
              <TableHead className="text-right min-w-[80px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                    ? "Tidak ada pengguna yang sesuai dengan filter"
                    : "Belum ada pengguna"}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{user.username}</span>
                        {user.id.toString() === currentUser.id && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            You
                          </Badge>
                        )}
                      </div>
                      {/* Show department on mobile */}
                      <div className="sm:hidden">
                        {user.department ? (
                          <span className="text-xs text-muted-foreground truncate">
                            {user.department.name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        getRoleBadgeColor(user.role) as
                          | "default"
                          | "secondary"
                          | "destructive"
                          | "outline"
                      }
                      className="text-xs"
                    >
                      {roleUtils.getRoleDisplayName(user.role)}
                    </Badge>
                  </TableCell>

                  <TableCell className="hidden sm:table-cell">
                    {user.department ? (
                      <div className="space-y-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {user.department.name}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {user.department.code}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1 sm:gap-2">
                      {user.isActive ? (
                        <UserCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <UserX className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                      <Badge
                        variant={user.isActive ? "success" : "destructive"}
                        className="text-xs"
                      >
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm hidden md:table-cell">
                    {user.lastLogin ? (
                      dateUtils.formatDateTime(user.lastLogin)
                    ) : (
                      <span className="text-muted-foreground">
                        Belum pernah
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-sm hidden lg:table-cell">
                    {dateUtils.formatDate(user.createdAt)}
                  </TableCell>

                  <TableCell className="text-right">
                    {canManageUser(user) ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleStatus(
                                user.id,
                                user.username,
                                user.isActive
                              )
                            }
                            disabled={isLoading}
                            className={
                              user.isActive ? "text-red-600" : "text-green-600"
                            }
                          >
                            {user.isActive ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Nonaktifkan
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Aktifkan
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <div className="flex items-center justify-end">
                        {user.id.toString() === currentUser.id ? (
                          <Badge variant="outline" className="text-xs">
                            Current User
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit User Dialog */}
      <EditUserDialog
        user={editUser}
        departments={departments}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
      
      {/* Confirmation Dialog */}
      {ConfirmationComponent}
    </div>
  );
}
