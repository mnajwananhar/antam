"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Session } from "next-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Upload, Table as TableIcon, Building } from "lucide-react";
import { Department } from "@prisma/client";
import {
  ExcelUpload,
  KtaKpiInputTable,
  type ExcelRowData,
  type KtaKpiItem,
} from "@/components/kta-tta";
import { useToastContext } from "@/lib/hooks";

interface KpiUtamaTabProps {
  department: Department;
  session: Session;
  editId?: number;
}

export function KpiUtamaTab({
  department,
}: Omit<KpiUtamaTabProps, "session">): React.JSX.Element {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedData, setUploadedData] = useState<ExcelRowData[]>([]);
  const [existingData, setExistingData] = useState<KtaKpiItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const { showSuccess, showError } = useToastContext();

  // Check if current department has access to KPI Utama
  const hasAccess =
    department.code === "BUREAU" || department.name === "MTC&ENG Bureau";

  const loadExistingData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      console.log(
        "Loading KPI Utama data - MTC&ENG Bureau unrestricted access"
      );
      const response = await fetch(`/api/kta-tta?dataType=KPI_UTAMA`);
      if (response.ok) {
        const result = await response.json();
        console.log(
          "Loaded KPI Utama data:",
          result.data?.length || 0,
          "records"
        );
        console.log("Unrestricted access - showing data from all departments");
        setExistingData(result.data || []);
      } else {
        showError("Gagal memuat data existing");
      }
    } catch {
      showError("Terjadi kesalahan saat memuat data");
    } finally {
      setIsLoadingData(false);
    }
  }, [showError]);

  // Load existing data
  useEffect(() => {
    if (hasAccess) {
      loadExistingData();
    }
  }, [department.id, hasAccess, loadExistingData]);

  const handleDataChange = (data: ExcelRowData[]) => {
    setUploadedData(data);
  };

  const handleSaveUploadedData = async () => {
    if (uploadedData.length === 0) {
      showError("Tidak ada data untuk disimpan");
      return;
    }

    // Validate required fields
    const invalidRows = uploadedData.filter((row) => {
      return (
        !row.nppPelapor?.trim() ||
        !row.namaPelapor?.trim() ||
        !row.tanggal?.trim() ||
        !row.lokasi?.trim() ||
        !row.keterangan?.trim() ||
        !row.picDepartemen?.trim()
      );
    });

    if (invalidRows.length > 0) {
      showError(`${invalidRows.length} baris memiliki field wajib yang kosong`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/kta-tta/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataType: "KPI_UTAMA",
          data: uploadedData,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess(`Berhasil menyimpan ${uploadedData.length} data KPI Utama`);
        setUploadedData([]);
        setActiveTab("data");
        await loadExistingData();
      } else {
        throw new Error(result.error || "Failed to save data");
      }
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Gagal menyimpan data"
      );
    } finally {
      setIsLoading(false);
    }
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

  // If department doesn't have access, show access denied
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              KPI Utama - Akses Terbatas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Building className="h-4 w-4" />
              <AlertDescription>
                Fitur KPI Utama hanya tersedia untuk departemen MTC&ENG Bureau.
                Departemen {department.name} dapat menggunakan fitur KTA & TTA.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Manajemen Data KPI Utama - {department.name}
            <Badge variant="default" className="ml-2">
              Bureau Only
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Upload dan kelola data KPI (Key Performance Indicator) Utama untuk
            semua departemen. Sebagai MTC&ENG Bureau, Anda dapat mengelola KPI
            dari semua departemen.
          </p>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Data
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <TableIcon className="h-4 w-4" />
            Data Tersimpan ({existingData.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <ExcelUpload
            onDataChange={handleDataChange}
            dataType="KPI_UTAMA"
            disabled={isLoading}
          />

          {/* Save Button */}
          {uploadedData.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {uploadedData.length} data siap disimpan
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (Multi-departemen)
                    </span>
                  </div>
                  <Button
                    onClick={handleSaveUploadedData}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? "Menyimpan..." : "Simpan Data KPI Utama"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <KtaKpiInputTable
            data={existingData}
            dataType="KPI_UTAMA"
            isLoading={isLoadingData}
            onStatusChange={handleStatusChange}
            onView={handleView}
            maxHeight="600px"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
