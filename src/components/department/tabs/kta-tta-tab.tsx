"use client";

import React, { useState, useEffect } from "react";
import { Session } from "next-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, Upload, Table as TableIcon } from "lucide-react";
import { Department } from "@prisma/client";
import {
  ExcelUpload,
  KtaKpiInputTable,
  type ExcelRowData,
  type KtaKpiItem,
} from "@/components/kta-tta";
import { useToastContext } from "@/lib/hooks";

interface KtaTtaTabProps {
  department: Department;
  session: Session;
  editId?: number;
}

export function KtaTtaTab({ department, session }: KtaTtaTabProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedData, setUploadedData] = useState<ExcelRowData[]>([]);
  const [existingData, setExistingData] = useState<KtaKpiItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const { showSuccess, showError } = useToastContext();

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const response = await fetch(`/api/kta-tta?dataType=KTA_TTA&pic=${department.code}`);
        if (response.ok) {
          const result = await response.json();
          setExistingData(result.data || []);
        } else {
          showError("Gagal memuat data existing");
        }
      } catch (error) {
        showError("Terjadi kesalahan saat memuat data");
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadData();
  }, [department.id, department.code]);

  const loadExistingData = async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch(`/api/kta-tta?dataType=KTA_TTA&pic=${department.code}`);
      if (response.ok) {
        const result = await response.json();
        setExistingData(result.data || []);
      } else {
        showError("Gagal memuat data existing");
      }
    } catch (error) {
      showError("Terjadi kesalahan saat memuat data");
    } finally {
      setIsLoadingData(false);
    }
  };

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
          dataType: "KTA_TTA",
          data: uploadedData.map((row) => ({
            ...row,
            picDepartemen: row.picDepartemen || department.code,
          })),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess(`Berhasil menyimpan ${uploadedData.length} data KTA & TTA`);
        setUploadedData([]);
        setActiveTab("data");
        await loadExistingData();
      } else {
        throw new Error(result.error || "Failed to save data");
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Gagal menyimpan data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: "OPEN" | "CLOSE") => {
    try {
      const response = await fetch(`/api/kta-tta/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusTindakLanjut: newStatus }),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess(`Status berhasil diubah menjadi ${newStatus}`);
        await loadExistingData();
      } else {
        throw new Error(result.error || "Failed to update status");
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Gagal mengubah status");
      throw error; // Re-throw to handle in component
    }
  };

  const handleView = (item: KtaKpiItem) => {
    console.log("View item:", item);
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Manajemen Data KTA & TTA - {department.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Upload dan kelola data KTA (Kartu Tindak Aman) & TTA (Temuan Tindak Aman) untuk departemen {department.name}.
            Data dapat diupload melalui Excel atau input manual.
          </p>
        </CardContent>
      </Card>


      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
            dataType="KTA_TTA"
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
                      (PIC: {department.code})
                    </span>
                  </div>
                  <Button
                    onClick={handleSaveUploadedData}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? "Menyimpan..." : "Simpan Data KTA & TTA"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <KtaKpiInputTable
            data={existingData}
            dataType="KTA_TTA"
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
