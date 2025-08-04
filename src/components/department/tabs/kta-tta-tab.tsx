"use client";

import React from "react";
import { Session } from "next-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet } from "lucide-react";
import { Department } from "@prisma/client";

interface KtaTtaTabProps {
  department: Department;
  session: Session;
  editId?: number;
}

export function KtaTtaTab({ department }: KtaTtaTabProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Manajemen Data KTA & TTA - {department.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Tab KTA & TTA untuk {department.name} - Coming Soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
