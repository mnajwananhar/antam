"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { KtaTtaDashboard } from "@/components/dashboard/kta-tta-dashboard";
import { StatusTindakLanjutDashboard } from "@/components/dashboard/status-tindak-lanjut-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Activity } from "lucide-react";

export default function MtcEngBurauDashboardPage(): React.JSX.Element {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard MTC ENG Burau</h1>
            <p className="text-muted-foreground">
              Monitoring KPI dan status tindak lanjut untuk departemen MTC ENG Burau
            </p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* KTA/TTA Dashboard */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-yellow-600" />
                  KTA/TTA - KPI Utama
                </CardTitle>
              </CardHeader>
              <CardContent>
                <KtaTtaDashboard />
              </CardContent>
            </Card>
          </div>

          {/* Status Tindak Lanjut Dashboard */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-yellow-600" />
                  Status Tindak Lanjut
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatusTindakLanjutDashboard />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Future Dashboard Components Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder for future dashboard components */}
          <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground text-sm">Dashboard Component 3</p>
            </CardContent>
          </Card>
          <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground text-sm">Dashboard Component 4</p>
            </CardContent>
          </Card>
          <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground text-sm">Dashboard Component 5</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}