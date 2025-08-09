import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma, dbUtils } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  ArrowRight,
  Settings,
  Activity,
  FileText,
  AlertTriangle,
  Wrench,
  Zap,
  BarChart3,
  Shield,
} from "lucide-react";
import { DEPARTMENT_FEATURES, FEATURE_LABELS } from "@/lib/constants";
import { departmentUtils } from "@/lib/utils";

export default async function InputDataPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  // Get accessible departments for the user
  const accessibleDepartments = await dbUtils.getAccessibleDepartments(
    parseInt(session.user.id)
  );

  if (accessibleDepartments.length === 0) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Tidak Ada Akses Departemen
          </h2>
          <p className="text-muted-foreground">
            Anda tidak memiliki akses ke departemen manapun. Hubungi
            administrator untuk mendapatkan akses.
          </p>
        </div>
      </AppLayout>
    );
  }

  // Get total equipment count (universal, not per department)
  const totalEquipmentCount = await prisma.equipment.count({
    where: {
      isActive: true,
    },
  });

  // Add equipment count to each department (same for all since equipment is universal)
  const departmentStats = accessibleDepartments.map((dept) => ({
    ...dept,
    equipmentCount: totalEquipmentCount,
  }));

  const getFeatureIcon = (feature: string) => {
    const iconMap = {
      EQUIPMENT_STATUS: Settings,
      DAILY_ACTIVITY: Activity,
      KTA_TTA: FileText,
      KPI_UTAMA: BarChart3,
      CRITICAL_ISSUE: AlertTriangle,
      MAINTENANCE_ROUTINE: Wrench,
      SAFETY_INCIDENT: Shield,
      ENERGY_IKES: Zap,
      ENERGY_CONSUMPTION: Zap,
    };
    return iconMap[feature as keyof typeof iconMap] || FileText;
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Pusat Data Departemen
          </h1>
          <p className="text-muted-foreground">
            Pilih departemen untuk melakukan input dan pengelolaan data
            operasional
          </p>
        </div>

        {/* Department Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departmentStats.map((department) => {
            const features =
              DEPARTMENT_FEATURES[
                department.name as keyof typeof DEPARTMENT_FEATURES
              ] || [];
            const isMtcEng = departmentUtils.isMtcEngBureau(department.name);

            return (
              <Card
                key={department.id}
                className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">
                        {department.name}
                      </CardTitle>
                      <CardDescription>
                        {department.description}
                      </CardDescription>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{department.code}</Badge>
                        {isMtcEng && (
                          <Badge
                            variant="default"
                            className="text-xs bg-primary text-primary-foreground"
                          >
                            Special Dept
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Peralatan Aktif
                    </span>
                    <span className="font-medium text-primary-700">
                      {department.equipmentCount}
                    </span>
                  </div>

                  {/* Available Features */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Fitur Tersedia:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {features.slice(0, 4).map((feature) => {
                        const Icon = getFeatureIcon(feature);
                        return (
                          <div
                            key={feature}
                            className="flex items-center gap-2 text-xs"
                          >
                            <Icon className="h-3 w-3 text-primary-600" />
                            <span className="truncate text-foreground">
                              {FEATURE_LABELS[
                                feature as keyof typeof FEATURE_LABELS
                              ] || feature}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {features.length > 4 && (
                      <p className="text-xs text-muted-foreground">
                        +{features.length - 4} fitur lainnya
                      </p>
                    )}
                  </div>



                  {/* Action Button */}
                  <Link
                    href={`/input/${departmentUtils.nameToSlug(
                      department.name
                    )}`}
                  >
                    <Button
                      className="w-full"
                      variant={isMtcEng ? "default" : "outline"}
                    >
                      Kelola Data
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
