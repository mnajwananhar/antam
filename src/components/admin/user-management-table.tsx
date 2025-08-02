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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MoreHorizontal,
  Edit,
  RotateCcw,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";
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
  currentUser,
}: UserManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const router = useRouter();

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

  const handleResetPassword = async (userId: number, username: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin mereset password untuk pengguna "${username}"?`
      )
    ) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal mereset password");
      }

      setMessage({
        type: "success",
        text: `Password berhasil direset untuk pengguna "${username}"`,
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Terjadi kesalahan sistem",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (
    userId: number,
    username: string,
    currentStatus: boolean
  ) => {
    const action = currentStatus ? "menonaktifkan" : "mengaktifkan";
    if (!confirm(`Apakah Anda yakin ingin ${action} pengguna "${username}"?`)) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/users/toggle-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, isActive: !currentStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal mengubah status pengguna");
      }

      setMessage({
        type: "success",
        text: `Status pengguna "${username}" berhasil diubah`,
      });

      // Refresh the page to get updated data
      router.refresh();
    } catch (error) {
      console.error("Error toggling user status:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Terjadi kesalahan sistem",
      });
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
      {/* Messages */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cari pengguna atau departemen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
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
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Tidak Aktif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          Menampilkan {filteredUsers.length} dari {users.length} pengguna
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Departemen</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
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
                    <div className="flex items-center gap-2">
                      {user.username}
                      {user.id.toString() === currentUser.id && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
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
                    >
                      {roleUtils.getRoleDisplayName(user.role)}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {user.department ? (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
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
                    <div className="flex items-center gap-2">
                      {user.isActive ? (
                        <UserCheck className="h-4 w-4 text-green-600" />
                      ) : (
                        <UserX className="h-4 w-4 text-red-600" />
                      )}
                      <Badge
                        variant={user.isActive ? "success" : "destructive"}
                      >
                        {user.isActive ? "Aktif" : "Tidak Aktif"}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm">
                    {user.lastLogin ? (
                      dateUtils.formatDateTime(user.lastLogin)
                    ) : (
                      <span className="text-muted-foreground">
                        Belum pernah
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-sm">
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
                            onClick={() => {
                              /* TODO: Implement edit user */
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleResetPassword(user.id, user.username)
                            }
                            disabled={isLoading}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset Password
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
  );
}
