"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  ExcelUpload,
  KtaKpiTable,
  type ExcelRowData,
  type KtaKpiItem,
} from "@/components/kta-tta";
import {
  FileSpreadsheet,
  Table as TableIcon,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

// Mock data untuk demo
const mockData: KtaKpiItem[] = [
  {
    id: 1,
    noRegister: "KTA-001-2025",
    nppPelapor: "12345",
    namaPelapor: "John Doe",
    perusahaanBiro: "PT ANTAM",
    tanggal: new Date("2025-01-15"),
    lokasi: "Area Tambang Level 5",
    areaTemuan: "Jalur Transportasi",
    keterangan: "Ditemukan kerusakan pada jalur rel yang dapat membahayakan keselamatan operasional. Perlu perbaikan segera.",
    kategori: "Keselamatan",
    sumberTemuan: "Inspeksi Rutin",
    picDepartemen: "PMTC",
    kriteriaKtaTta: "Keselamatan Kerja - Infrastruktur",
    perusahaanPengelola: "PT ANTAM UPBE Pongkor",
    tindakLanjutLangsung: "Memasang barrier sementara dan memberikan warning sign di area tersebut.",
    statusTindakLanjut: "OPEN",
    biro: "PMTC",
    dueDate: new Date("2025-02-15"),
    updateStatus: "Proses",
    dataType: "KTA_TTA",
    createdAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-01-15"),
    createdBy: {
      id: 1,
      username: "inputter1",
      role: "INPUTTER",
    },
  },
  {
    id: 2,
    noRegister: "KPI-002-2025",
    tanggal: new Date("2025-01-20"),
    lokasi: "Mill Area",
    keterangan: "Peningkatan efisiensi grinding process melalui optimasi parameter operasional.",
    picDepartemen: "MTC&ENG Bureau",
    statusTindakLanjut: "CLOSE",
    dueDate: new Date("2025-01-30"),
    dataType: "KPI_UTAMA",
    createdAt: new Date("2025-01-18"),
    updatedAt: new Date("2025-01-25"),
    createdBy: {
      id: 2,
      username: "planner_bureau",
      role: "PLANNER",
    },
  },
];


export default function DemoKtaTtaPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedData, setUploadedData] = useState<ExcelRowData[]>([]);
  const [tableData, setTableData] = useState<KtaKpiItem[]>(mockData);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/signin");
    }
  }, [status]);

  const handleDataChange = (data: ExcelRowData[]) => {
    setUploadedData(data);
    setMessage(null);
  };

  const handleSaveUploadedData = async () => {
    if (uploadedData.length === 0) {
      setMessage({
        type: "error",
        text: "Tidak ada data untuk disimpan",
      });
      return;
    }

    // Validate required fields
    const invalidRows = uploadedData.filter((row) => {
      return (
        !row.noRegister?.trim() ||
        !row.tanggal?.trim() ||
        !row.lokasi?.trim() ||
        !row.keterangan?.trim() ||
        !row.picDepartemen?.trim()
      );
    });

    if (invalidRows.length > 0) {
      setMessage({
        type: "error",
        text: `${invalidRows.length} baris memiliki field wajib yang kosong`,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Convert uploaded data to table format
      const convertedData: KtaKpiItem[] = uploadedData.map((row, index) => ({
        id: Date.now() + index,
        noRegister: row.noRegister || `AUTO-${Date.now()}-${index}`,
        nppPelapor: row.nppPelapor,
        namaPelapor: row.namaPelapor,
        perusahaanBiro: row.perusahaanBiro,
        tanggal: row.tanggal ? new Date(row.tanggal) : new Date(),
        lokasi: row.lokasi,
        areaTemuan: row.areaTemuan,
        keterangan: row.keterangan,
        kategori: row.kategori,
        sumberTemuan: row.sumberTemuan,
        picDepartemen: row.picDepartemen,
        kriteriaKtaTta: row.kriteriaKtaTta,
        perusahaanPengelola: row.perusahaanPengelola,
        tindakLanjutLangsung: row.tindakLanjutLangsung,
        statusTindakLanjut: (row.statusTindakLanjut as "OPEN" | "CLOSE") || "OPEN",
        biro: row.biro,
        dueDate: row.dueDate ? new Date(row.dueDate) : undefined,
        updateStatus: "Proses",
        dataType: "KTA_TTA",
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: {
          id: 1,
          username: session?.user?.username || "demo",
          role: session?.user?.role || "INPUTTER",
        },
      }));

      // Add to existing table data
      setTableData((prev) => [...convertedData, ...prev]);
      setUploadedData([]);
      setActiveTab("table");

      setMessage({
        type: "success",
        text: `Berhasil menyimpan ${convertedData.length} data`,
      });
    } catch {
      setMessage({
        type: "error",
        text: "Gagal menyimpan data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: KtaKpiItem) => {
    alert(`Edit item: ${item.noRegister}`);
  };

  const handleDelete = (id: number) => {
    setTableData((prev) => prev.filter((item) => item.id !== id));
    setMessage({
      type: "success",
      text: "Data berhasil dihapus",
    });
  };

  const handleView = (item: KtaKpiItem) => {
    console.log("View item:", item);
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (status === "loading") {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Memuat Aplikasi</h3>
            <p className="text-muted-foreground">Sedang memverifikasi sesi...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (status === "unauthenticated" || !session) {
    return <div></div>;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Demo KTA & TTA / KPI Utama</h1>
            <p className="text-muted-foreground">
              Demonstrasi fitur upload Excel dan preview table dengan scroll container
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Demo Mode
          </Badge>
        </div>

        {/* Messages */}
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            {message.type === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Upload Excel
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <TableIcon className="h-4 w-4" />
              Data Table ({tableData.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="space-y-4">
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
                        <Badge
                          variant={
                            uploadedData.every((row) => {
                              return (
                                row.noRegister?.trim() &&
                                row.tanggal?.trim() &&
                                row.lokasi?.trim() &&
                                row.keterangan?.trim() &&
                                row.picDepartemen?.trim()
                              );
                            })
                              ? "default"
                              : "destructive"
                          }
                        >
                          {
                            uploadedData.filter((row) => {
                              return (
                                row.noRegister?.trim() &&
                                row.tanggal?.trim() &&
                                row.lokasi?.trim() &&
                                row.keterangan?.trim() &&
                                row.picDepartemen?.trim()
                              );
                            }).length
                          }{" "}
                          valid
                        </Badge>
                      </div>
                      <Button
                        onClick={handleSaveUploadedData}
                        disabled={isLoading || uploadedData.length === 0}
                        className="flex items-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Simpan Data
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="table" className="space-y-6">
            <KtaKpiTable
              data={tableData}
              dataType="KTA_TTA"
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              maxHeight="600px"
            />
          </TabsContent>
        </Tabs>

        {/* Features Info */}
        <Card>
          <CardHeader>
            <CardTitle>Fitur yang Tersedia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold">Excel Upload Component:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Upload file Excel (.xlsx, .xls)</li>
                  <li>• Preview data dalam table dengan scroll</li>
                  <li>• Edit cell secara inline</li>
                  <li>• Tambah/hapus baris</li>
                  <li>• Validasi field wajib</li>
                  <li>• Download template Excel</li>
                  <li>• Responsive design</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold">Data Table Component:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Table dengan scroll container</li>
                  <li>• Sticky header</li>
                  <li>• View detail dalam dialog</li>
                  <li>• Edit dan delete actions</li>
                  <li>• Status badges</li>
                  <li>• Summary footer</li>
                  <li>• Maximum height control</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}