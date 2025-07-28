"use client";

import { Session } from "next-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Department } from "@prisma/client";

interface KtaTtaTabProps {
  department: Department;
  session: Session;
}

export function KtaTtaTab({ department }: KtaTtaTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          KTA & TTA - {department.name}
        </CardTitle>
        <CardDescription>
          Manajemen data KTA (Kartu Tindak Aman) dan TTA (Tindakan Tidak Aman)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">KTA & TTA</h3>
          <p className="text-muted-foreground mb-4">
            Fitur ini sedang dalam pengembangan. Akan tersedia:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 max-w-md mx-auto">
            <li>• Upload Excel dengan pratinjau CRUD</li>
            <li>• Input manual data KTA & TTA</li>
            <li>• Management PIC departemen</li>
            <li>• Tracking status tindak lanjut</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
