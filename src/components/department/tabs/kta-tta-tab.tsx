"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Session } from "next-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table as TableIcon, Info, RefreshCw } from "lucide-react";
import { Department } from "@prisma/client";
import {
  KtaKpiInputTable,
  type KtaKpiItem,
} from "@/components/kta-tta";
import { useToastContext } from "@/lib/hooks";
import { notifyDataUpdate, DATA_CATEGORIES } from "@/lib/utils/data-sync";

interface KtaTtaTabProps {
  department: Department;
  session: Session;
  editId?: number;
}


export function KtaTtaTab({
  department,
}: KtaTtaTabProps): React.JSX.Element {
  const [existingData, setExistingData] = useState<KtaKpiItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const { showSuccess, showError } = useToastContext();

  const loadExistingData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      console.log(`Loading KTA-TTA data for department: ${department.code}`);
      const response = await fetch(`/api/kta-tta?department=${department.code}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(
          `Loaded filtered KTA-TTA data: ${result.data?.length || 0} records for ${department.code}`
        );
        setExistingData(result.data || []);
      } else {
        showError("Gagal memuat data KTA-TTA");
      }
    } catch {
      showError("Terjadi kesalahan saat memuat data");
    } finally {
      setIsLoadingData(false);
    }
  }, [department.code, showError]);

  // Load existing data with department PIC filtering
  useEffect(() => {
    loadExistingData();
  }, [loadExistingData]);

  // Status-only edit is handled by the table component directly

  const handleRefresh = () => {
    loadExistingData();
  };

  const handleStatusChange = async (
    id: number,
    newStatus: "OPEN" | "CLOSE"
  ) => {
    try {
      const response = await fetch(`/api/kta-tta/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusTindakLanjut: newStatus }),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess(`Status berhasil diubah menjadi ${newStatus}`);

        // Notify other tabs about the data change
        notifyDataUpdate(DATA_CATEGORIES.KTA_TTA);

        // Update status in local state without API call
        setExistingData((prevData) =>
          prevData.map((item) =>
            item.id === id
              ? {
                  ...item,
                  statusTindakLanjut: newStatus,
                  updateStatus:
                    newStatus === "CLOSE"
                      ? "Close"
                      : item.dueDate && new Date(item.dueDate) < new Date()
                      ? "Due Date"
                      : "Proses",
                }
              : item
          )
        );
      } else {
        throw new Error(result.error || "Failed to update status");
      }
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Gagal mengubah status"
      );
      throw error; // Re-throw to handle in component
    }
  };

  const handleView = (item: KtaKpiItem) => {
    console.log("View item:", item);
  };


  return (
    <div className="space-y-6">
      {/* Info Header */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Data KTA & TTA untuk {department.name}</strong>
          <br />
          Menampilkan data berdasarkan PIC Departemen. Anda hanya dapat mengedit status data yang terkait dengan departemen ini.
          Upload data KTA & TTA telah dipindahkan ke tab <strong>KPI Utama</strong> di departemen <strong>MTC&ENG Bureau</strong>.
        </AlertDescription>
      </Alert>

      {/* Data Table Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TableIcon className="h-5 w-5" />
              <CardTitle>Data KTA & TTA ({existingData.length})</CardTitle>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoadingData}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Menampilkan data KTA & TTA yang terkait dengan <strong>{department.name}</strong>. 
            Anda dapat mengedit status tindak lanjut untuk monitoring progress.
          </p>
        </CardContent>
      </Card>

      {/* Data Table Only */}
      <KtaKpiInputTable
        data={existingData}
        dataType="KTA_TTA"
        isLoading={isLoadingData}
        onStatusChange={handleStatusChange}
        onView={handleView}
        maxHeight="600px"
      />
    </div>
  );
}