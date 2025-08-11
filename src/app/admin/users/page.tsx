"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppLayout } from "@/components/layout/app-layout";
import { UserManagementTable } from "@/components/admin/user-management-table";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { TableSkeleton } from "@/components/ui/table-skeleton";
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
import type { User, Department } from "@prisma/client";

interface UserWithDepartment extends User {
  department: Department | null;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<UserWithDepartment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      redirect("/auth/signin");
      return;
    }

    if (session.user.role !== "ADMIN") {
      setLoading(false);
      return;
    }

    // Fetch users and departments
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users
        const usersResponse = await fetch("/api/admin/users");
        if (!usersResponse.ok) throw new Error("Failed to fetch users");
        const usersData = await usersResponse.json();
        
        // Fetch departments
        const departmentsResponse = await fetch("/api/departments");
        if (!departmentsResponse.ok) throw new Error("Failed to fetch departments");
        const departmentsData = await departmentsResponse.json();
        
        setUsers(usersData.data || []);
        setDepartments(departmentsData.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, status]);

  if (status === "loading" || loading) {
    return (
      <AppLayout>
        <div className="space-y-8">
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
          </div>
          
          {/* Loading skeleton for stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                  <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted animate-pulse rounded w-16 mb-2"></div>
                  <div className="h-3 bg-muted animate-pulse rounded w-24"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading skeleton for table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Pengguna</CardTitle>
              <CardDescription>
                Kelola semua akun pengguna sistem beserta role dan akses departemen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TableSkeleton
                columns={7}
                rows={8}
                showSearch={true}
                showFilters={true}
                showPagination={false}
              />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!session) {
    redirect("/auth/signin");
    return null;
  }

  // Check if user is admin
  if (session.user.role !== "ADMIN") {
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

  if (error) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Error: {error}
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  // Calculate user statistics
  const userStats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
    byRole: {
      ADMIN: users.filter((u) => u.role === "ADMIN").length,
      PLANNER: users.filter((u) => u.role === "PLANNER").length,
      INPUTTER: users.filter((u) => u.role === "INPUTTER").length,
      VIEWER: users.filter((u) => u.role === "VIEWER").length,
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
