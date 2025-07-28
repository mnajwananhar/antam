"use client";

import { useState } from "react";
import { Session } from "next-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EquipmentStatusTab } from "./tabs/equipment-status-tab";
import { DailyActivityTab } from "./tabs/daily-activity-tab";
import { KtaTtaTab } from "./tabs/kta-tta-tab";
import { KpiUtamaTab } from "./tabs/kpi-utama-tab";
import { CriticalIssueTab } from "./tabs/critical-issue-tab";
import { MaintenanceRoutineTab } from "./tabs/maintenance-routine-tab";
import { SafetyIncidentTab } from "./tabs/safety-incident-tab";
import { EnergyIkesTab } from "./tabs/energy-ikes-tab";
import { EnergyConsumptionTab } from "./tabs/energy-consumption-tab";
import {
  Settings,
  Activity,
  FileText,
  BarChart3,
  AlertTriangle,
  Wrench,
  Shield,
  Zap,
  Plug,
} from "lucide-react";
import { FEATURE_LABELS } from "@/lib/constants";
import { roleUtils } from "@/lib/utils";
import { Equipment, Department, EquipmentStatus } from "@prisma/client";

interface EquipmentWithStatus extends Equipment {
  currentStatus: EquipmentStatus;
  lastStatusChange: Date;
}

interface DepartmentInputTabsProps {
  department: Department;
  equipment: EquipmentWithStatus[];
  availableFeatures: readonly string[];
  session: Session;
}

export function DepartmentInputTabs({
  department,
  equipment,
  availableFeatures,
  session,
}: DepartmentInputTabsProps) {
  const [activeTab, setActiveTab] = useState(availableFeatures[0] || "");

  const getTabIcon = (feature: string) => {
    const iconMap = {
      EQUIPMENT_STATUS: Settings,
      DAILY_ACTIVITY: Activity,
      KTA_TTA: FileText,
      KPI_UTAMA: BarChart3,
      CRITICAL_ISSUE: AlertTriangle,
      MAINTENANCE_ROUTINE: Wrench,
      SAFETY_INCIDENT: Shield,
      ENERGY_IKES: Zap,
      ENERGY_CONSUMPTION: Plug,
    };
    return iconMap[feature as keyof typeof iconMap] || FileText;
  };

  const canAccessFeature = (feature: string): boolean => {
    // Check role-based access for specific features
    if (feature === "MAINTENANCE_ROUTINE") {
      return roleUtils.canAccessMaintenanceRoutine(session.user.role);
    }

    // Check if feature is available for this department
    return availableFeatures.includes(feature);
  };

  const renderTabContent = (feature: string) => {
    if (!canAccessFeature(feature)) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Akses Terbatas</h3>
              <p className="text-muted-foreground">
                Anda tidak memiliki akses untuk fitur ini.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    switch (feature) {
      case "EQUIPMENT_STATUS":
        return (
          <EquipmentStatusTab
            equipment={equipment}
            department={department}
          />
        );

      case "DAILY_ACTIVITY":
        return (
          <DailyActivityTab
            equipment={equipment}
            department={department}
            session={session}
          />
        );

      case "KTA_TTA":
        return <KtaTtaTab department={department} session={session} />;

      case "KPI_UTAMA":
        return <KpiUtamaTab department={department} session={session} />;

      case "CRITICAL_ISSUE":
        return <CriticalIssueTab department={department} session={session} />;

      case "MAINTENANCE_ROUTINE":
        return (
          <MaintenanceRoutineTab department={department} session={session} />
        );

      case "SAFETY_INCIDENT":
        return <SafetyIncidentTab department={department} session={session} />;

      case "ENERGY_IKES":
        return <EnergyIkesTab department={department} session={session} />;

      case "ENERGY_CONSUMPTION":
        return (
          <EnergyConsumptionTab department={department} session={session} />
        );

      default:
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {FEATURE_LABELS[feature as keyof typeof FEATURE_LABELS] || feature}
                </h3>
                <p className="text-muted-foreground">
                  Tab ini belum tersedia.
                </p>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  if (availableFeatures.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Tidak Ada Fitur Tersedia
            </h3>
            <p className="text-muted-foreground">
              Tidak ada fitur input data yang tersedia untuk departemen ini.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-1 h-auto p-1">
            {availableFeatures.map((feature) => {
              const Icon = getTabIcon(feature);
              const isAccessible = canAccessFeature(feature);

              return (
                <TabsTrigger
                  key={feature}
                  value={feature}
                  className="flex flex-col gap-1 h-16 text-xs relative"
                  disabled={!isAccessible}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-center leading-tight">
                    {FEATURE_LABELS[feature as keyof typeof FEATURE_LABELS] ||
                      feature}
                  </span>
                  {!isAccessible && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 text-xs px-1"
                    >
                      !
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {availableFeatures.map((feature) => (
          <TabsContent key={feature} value={feature} className="mt-6">
            {renderTabContent(feature)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
