"use client";

import { Session } from "next-auth";
import { Department } from "@prisma/client";
import { ExcelUpload } from "@/components/kta-tta";
import { getAllowedPIC, hasDataTypeAccess } from "@/lib/utils/kta-tta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useApiToast } from "@/components/providers/toast-provider";
import { AlertTriangle, FileSpreadsheet } from "lucide-react";
import { useState } from "react";

interface KtaTtaTabProps {
  department: Department;
  session: Session;
  editId?: number;
}

interface ExcelRow {
  [key: string]: string | number | undefined;
}

export function KtaTtaTab({ session }: KtaTtaTabProps) {
  const [isUploading, setIsUploading] = useState(false);

  // ✅ MENGGUNAKAN TOAST SYSTEM YANG ROBUST
  const { executeWithToast } = useApiToast();

  const user = {
    id: session.user.id,
    username: session.user.username,
    role: session.user.role as "ADMIN" | "PLANNER" | "INPUTTER" | "VIEWER",
    department: session.user.departmentName,
  };

  // Check access permission
  const hasAccess = hasDataTypeAccess(
    user.role,
    user.department || undefined,
    "KTA_TTA"
  );
  const allowedPIC = getAllowedPIC(
    user.role,
    user.department || undefined,
    "KTA_TTA"
  );

  const handleBulkUpload = async (excelData: ExcelRow[]) => {
    setIsUploading(true);
    try {
      // ✅ MENGGUNAKAN TOAST SYSTEM - AUTOMATIC SUCCESS/ERROR NOTIFICATION
      const result = await executeWithToast(
        () =>
          fetch("/api/kta-tta", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: excelData,
              userId: user.id,
              pic: allowedPIC,
              dataType: "KTA_TTA",
            }),
          }),
        "Data KTA & TTA berhasil diupload",
        "Gagal mengupload data KTA & TTA"
      );

      if (result.success) {
        // Success message sudah ditampilkan oleh executeWithToast
      }
    } catch (error) {
      console.error("Error uploading data:", error);
      // Toast system akan menampilkan error secara otomatis
    } finally {
      setIsUploading(false);
    }
  };

  if (!hasAccess) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Fitur KTA & TTA tidak tersedia untuk MTC&ENG Bureau.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5" />
            <span>Input Data KTA & TTA</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExcelUpload
            onUpload={handleBulkUpload}
            allowedPIC={allowedPIC}
            dataType="KTA_TTA"
            isUploading={isUploading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
