"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { Department } from "@prisma/client";
import { EquipmentWithStatus } from "@/types/equipment";

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
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get URL parameters
  const urlTab = searchParams.get("tab");
  const editId = searchParams.get("edit");

  // Set initial active tab based on URL parameter or first available feature
  const [activeTab, setActiveTab] = useState(() => {
    if (urlTab && availableFeatures.includes(urlTab)) {
      return urlTab;
    }
    return availableFeatures[0] || "";
  });

  // Handle tab change with URL update
  const handleTabChange = (newTab: string): void => {
    setActiveTab(newTab);

    // Update URL without page refresh
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);

    // Keep editId if it exists
    if (editId) {
      params.set("edit", editId);
    }

    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Update active tab when URL changes
  useEffect(() => {
    if (urlTab && availableFeatures.includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab, availableFeatures]);

  // Set initial tab in URL if not present
  useEffect(() => {
    if (!urlTab && availableFeatures.length > 0 && activeTab) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", activeTab);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [urlTab, availableFeatures, activeTab, router, searchParams]);

  // Log for debugging
  useEffect(() => {
    if (editId) {
      console.log(
        `Edit mode activated for tab: ${activeTab}, record ID: ${editId}`
      );
    }
  }, [activeTab, editId]);

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

    // Pass editId to each tab component
    const commonProps = {
      department,
      session,
      editId: editId ? parseInt(editId) : undefined,
    };

    switch (feature) {
      case "EQUIPMENT_STATUS":
        return (
          <EquipmentStatusTab equipment={equipment} department={department} />
        );

      case "DAILY_ACTIVITY":
        return (
          <DailyActivityTab
            equipment={equipment}
            department={department}
            session={session}
            editId={editId ? parseInt(editId) : undefined}
          />
        );

      case "KTA_TTA":
        return <KtaTtaTab {...commonProps} />;

      case "KPI_UTAMA":
        return <KpiUtamaTab {...commonProps} />;

      case "CRITICAL_ISSUE":
        return <CriticalIssueTab {...commonProps} />;

      case "MAINTENANCE_ROUTINE":
        return <MaintenanceRoutineTab {...commonProps} />;

      case "SAFETY_INCIDENT":
        return <SafetyIncidentTab {...commonProps} />;

      case "ENERGY_IKES":
        return <EnergyIkesTab {...commonProps} />;

      case "ENERGY_CONSUMPTION":
        return <EnergyConsumptionTab {...commonProps} />;

      default:
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {FEATURE_LABELS[feature as keyof typeof FEATURE_LABELS] ||
                    feature}
                </h3>
                <p className="text-muted-foreground">Tab ini belum tersedia.</p>
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
      {/* Edit Mode Indicator */}
      {editId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 rounded-full p-1">
              <Settings className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Mode Edit</h3>
              <p className="text-sm text-blue-700">
                Anda sedang mengedit data dengan ID: {editId} pada tab{" "}
                {FEATURE_LABELS[activeTab as keyof typeof FEATURE_LABELS]}
              </p>
            </div>
          </div>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-1 h-auto p-1">
            {availableFeatures.map((feature) => {
              const Icon = getTabIcon(feature);
              const isAccessible = canAccessFeature(feature);
              const isActive = activeTab === feature;

              return (
                <TabsTrigger
                  key={feature}
                  value={feature}
                  className={`flex flex-col gap-1 h-16 text-xs relative ${
                    isActive && editId ? "bg-blue-100 border-blue-300" : ""
                  }`}
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
                  {isActive && editId && (
                    <Badge
                      variant="default"
                      className="absolute -top-1 -left-1 text-xs px-1"
                    >
                      Edit
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
