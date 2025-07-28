"use client";

import { Session } from "next-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { Department } from "@prisma/client";

interface KpiUtamaTabProps {
  department: Department;
  session: Session;
}

export function KpiUtamaTab({ department }: KpiUtamaTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          KPI Utama - {department.name}
        </CardTitle>
        <CardDescription>
          Manajemen data Key Performance Indicator utama (khusus MTC&ENG Bureau)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">KPI Utama</h3>
          <p className="text-muted-foreground">
            Fitur khusus untuk departemen MTC&ENG Bureau dalam pengembangan.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function CriticalIssueTab({
  department,
}: {
  department: Department;
  session: Session;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-red-600">⚠️</span>
          Critical Issue - {department.name}
        </CardTitle>
        <CardDescription>
          Pencatatan dan penanganan masalah kritis operasional
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <span className="mx-auto block text-6xl mb-4">⚠️</span>
          <h3 className="text-lg font-semibold mb-2">Critical Issue</h3>
          <p className="text-muted-foreground">
            Sistem pelaporan masalah kritis dalam pengembangan.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function MaintenanceRoutineTab({
  department,
}: {
  department: Department;
  session: Session;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🔧</span>
          Maintenance Rutin - {department.name}
        </CardTitle>
        <CardDescription>
          Pencatatan jadwal dan detail perawatan rutin (akses terbatas untuk
          Planner)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <span className="mx-auto block text-6xl mb-4">🔧</span>
          <h3 className="text-lg font-semibold mb-2">Maintenance Rutin</h3>
          <p className="text-muted-foreground">
            Sistem manajemen maintenance rutin dalam pengembangan.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function SafetyIncidentTab({
  department,
}: {
  department: Department;
  session: Session;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🛡️</span>
          Pelaporan Insiden Keselamatan - {department.name}
        </CardTitle>
        <CardDescription>
          Input data insiden keselamatan bulanan (khusus MTC&ENG Bureau)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <span className="mx-auto block text-6xl mb-4">🛡️</span>
          <h3 className="text-lg font-semibold mb-2">Safety Incident</h3>
          <p className="text-muted-foreground">
            Sistem pelaporan keselamatan dalam pengembangan.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function EnergyIkesTab({
  department,
}: {
  department: Department;
  session: Session;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>⚡</span>
          Input IKES & Emisi - {department.name}
        </CardTitle>
        <CardDescription>
          Input data realisasi IKES dan emisi bulanan (khusus MTC&ENG Bureau)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <span className="mx-auto block text-6xl mb-4">⚡</span>
          <h3 className="text-lg font-semibold mb-2">IKES & Emisi</h3>
          <p className="text-muted-foreground">
            Sistem input data energi dalam pengembangan.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function EnergyConsumptionTab({
  department,
}: {
  department: Department;
  session: Session;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🔌</span>
          Konsumsi Energi Listrik - {department.name}
        </CardTitle>
        <CardDescription>
          Input data konsumsi energi listrik per area (khusus MTC&ENG Bureau)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <span className="mx-auto block text-6xl mb-4">🔌</span>
          <h3 className="text-lg font-semibold mb-2">Konsumsi Energi</h3>
          <p className="text-muted-foreground">
            Sistem monitoring konsumsi energi dalam pengembangan.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
