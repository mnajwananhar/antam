import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma, dbUtils } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/app-layout";
import { DepartmentInputTabs } from "@/components/department/department-input-tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { DEPARTMENT_FEATURES } from "@/lib/constants";
import { departmentUtils } from "@/lib/utils";

interface DepartmentInputPageProps {
  params: Promise<{
    department: string;
  }>;
}

export default async function DepartmentInputPage({
  params,
}: DepartmentInputPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  // Convert URL slug back to department name
  const { department: departmentSlug } = await params;
  const departmentName = departmentUtils.slugToName(departmentSlug);

  // Find department in database
  const department = await prisma.department.findFirst({
    where: {
      name: {
        equals: departmentName,
        mode: "insensitive",
      },
      isActive: true,
    },
  });

  if (!department) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/input">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </Link>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Departemen tidak ditemukan atau tidak aktif.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  // Check user access to this department
  const hasAccess = await dbUtils.checkDepartmentAccess(
    parseInt(session.user.id),
    department.id
  );

  if (!hasAccess) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/input">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </Link>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Anda tidak memiliki akses untuk mengelola data departemen ini.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  // Get available features for this department
  const availableFeatures = (DEPARTMENT_FEATURES[
    department.name as keyof typeof DEPARTMENT_FEATURES
  ] || []) as readonly string[];
  const isMtcEngBureau = departmentUtils.isMtcEngBureau(department.name);

  // Get all equipment with current status
  const equipment = await prisma.equipment.findMany({
    where: { isActive: true },
    include: {
      category: true,
      equipmentStatusHistory: {
        take: 1,
        orderBy: { changedAt: "desc" },
      },
    },
  });

  // Get equipment with current status
  const equipmentWithStatus = equipment.map((eq) => ({
    ...eq,
    currentStatus: eq.equipmentStatusHistory[0]?.status || "WORKING",
    lastStatusChange: eq.equipmentStatusHistory[0]?.changedAt || eq.createdAt,
  }));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/input">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </Link>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {department.name}
                </h1>
                <Badge variant="outline">{department.code}</Badge>
                {isMtcEngBureau && (
                  <Badge variant="default">Special Department</Badge>
                )}
              </div>
              <p className="text-muted-foreground">{department.description}</p>
            </div>
          </div>
        </div>

        {/* Main Input Interface */}
        <DepartmentInputTabs
          department={department}
          equipment={equipmentWithStatus}
          availableFeatures={availableFeatures}
          session={session}
        />
      </div>
    </AppLayout>
  );
}
