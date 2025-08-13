"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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