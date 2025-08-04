import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/app-layout";
import { UserManagementTable } from "@/components/admin/user-management-table";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  Plus,
  Shield,
  UserPlus,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { UserRole } from "@prisma/client";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  // Check if user is admin
  if (session.user.role !== UserRole.ADMIN) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Anda tidak memiliki akses untuk halaman ini. Hanya administrator
              yang dapat mengelola pengguna.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  // Fetch all users with department info
  const users = await prisma.user.findMany({
    include: {
      department: true,
    },
    orderBy: [{ role: "asc" }, { username: "asc" }],
  });

  // Fetch all departments for create/edit form
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  // Calculate user statistics
  const userStats = {
    total: users.length,
    active: users.filter((u: (typeof users)[0]) => u.isActive).length,
    inactive: users.filter((u: (typeof users)[0]) => !u.isActive).length,
    byRole: {
      ADMIN: users.filter((u: (typeof users)[0]) => u.role === UserRole.ADMIN)
        .length,
      PLANNER: users.filter(
        (u: (typeof users)[0]) => u.role === UserRole.PLANNER
      ).length,
      INPUTTER: users.filter(
        (u: (typeof users)[0]) => u.role === UserRole.INPUTTER
      ).length,
      VIEWER: users.filter((u: (typeof users)[0]) => u.role === UserRole.VIEWER)
        .length,
    },
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Manajemen Pengguna
              </h1>
              <Badge variant="destructive" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Admin Only
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Kelola akun pengguna sistem, role, dan akses departemen
            </p>
          </div>
          <CreateUserDialog departments={departments}>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Pengguna
            </Button>
          </CreateUserDialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Pengguna
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {userStats.active} aktif, {userStats.inactive} tidak aktif
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Administrator
              </CardTitle>
              <Shield className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {userStats.byRole.ADMIN}
              </div>
              <p className="text-xs text-muted-foreground">
                Akses penuh sistem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planner</CardTitle>
              <Settings className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {userStats.byRole.PLANNER}
              </div>
              <p className="text-xs text-muted-foreground">Per departemen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inputter</CardTitle>
              <UserPlus className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {userStats.byRole.INPUTTER}
              </div>
              <p className="text-xs text-muted-foreground">Global access</p>
            </CardContent>
          </Card>
        </div>

        {/* User Management Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengguna</CardTitle>
            <CardDescription>
              Kelola semua akun pengguna sistem beserta role dan akses
              departemen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserManagementTable
              users={users}
              departments={departments}
              currentUser={session.user}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
