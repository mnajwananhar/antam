import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppLayout } from "@/components/layout/app-layout";
import { DataReviewClient } from "@/components/data-review/data-review-client";
import { Database } from "lucide-react";

async function getInitialData() {
  return {
    departments: [
      { id: 1, name: "MTC&ENG Bureau", code: "MTCENG" },
      { id: 2, name: "MMTC", code: "MMTC" },
      { id: 3, name: "PMTC", code: "PMTC" },
      { id: 4, name: "ECDC", code: "ECDC" },
      { id: 5, name: "HETU", code: "HETU" },
    ],
    dataCategories: [
      {
        id: "operational-reports",
        name: "Aktivitas Harian",
        description: "Data laporan operasional harian peralatan",
        icon: "activity",
        table: "operational_reports",
      },
      {
        id: "kta-tta",
        name: "KTA & TTA",
        description: "Data KTA dan TTA departemen",
        icon: "clipboard-list",
        table: "kta_kpi_data",
        filter: "KTA_TTA",
      },
      {
        id: "kpi-utama",
        name: "KPI Utama",
        description: "Data KPI Utama MTC&ENG Bureau",
        icon: "trending-up",
        table: "kta_kpi_data",
        filter: "KPI_UTAMA",
        departmentSpecific: "MTC&ENG Bureau",
      },
      {
        id: "maintenance-routine",
        name: "Maintenance Rutin",
        description: "Data maintenance preventive rutin",
        icon: "wrench",
        table: "maintenance_routine",
      },
      {
        id: "critical-issues",
        name: "Critical Issue",
        description: "Data masalah kritis operasional",
        icon: "alert-triangle",
        table: "critical_issues",
      },
      {
        id: "safety-incidents",
        name: "Insiden Keselamatan",
        description: "Data pelaporan insiden keselamatan bulanan",
        icon: "shield-alert",
        table: "safety_incidents",
        departmentSpecific: "MTC&ENG Bureau",
      },
      {
        id: "energy-targets",
        name: "Target IKES & Emisi",
        description: "Data target dan realisasi IKES & Emisi",
        icon: "zap",
        table: "energy_targets",
        departmentSpecific: "MTC&ENG Bureau",
      },
      {
        id: "energy-consumption",
        name: "Konsumsi Energi",
        description: "Data konsumsi energi listrik bulanan",
        icon: "battery",
        table: "energy_consumption",
        departmentSpecific: "MTC&ENG Bureau",
      },
    ],
  };
}

export default async function DataReviewPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const initialData = await getInitialData();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Database className="h-8 w-8 text-primary" />
              Data Review & Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Kelola semua data dari berbagai fitur input sistem - lihat, edit,
              dan hapus data
            </p>
          </div>
        </div>

        {/* Main Content */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }
        >
          <DataReviewClient
            departments={initialData.departments}
            dataCategories={initialData.dataCategories}
            session={session}
          />
        </Suspense>
      </div>
    </AppLayout>
  );
}
