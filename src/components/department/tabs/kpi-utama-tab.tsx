"use client";

import React from "react";
import { Session } from "next-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { Department } from "@prisma/client";

interface KpiUtamaTabProps {
  department: Department;
  session: Session;
  editId?: number;
}

export function KpiUtamaTab({
  department,
}: KpiUtamaTabProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Manajemen Data KPI Utama - {department.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Tab KPI Utama untuk {department.name} - Coming Soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
