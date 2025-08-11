"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getAllowedPIC, hasDataAccess } from "@/lib/utils/kta-tta";
import {
  FileSpreadsheet,
  BarChart3,
  Download,
  RefreshCw,
  Search,
  X,
  Trash2,
} from "lucide-react";

interface User {
  id: string;
  username: string;
  role: "ADMIN" | "PLANNER" | "INPUTTER" | "VIEWER";
  department?: string;
}

interface KtaTtaRecord {
  id: number;
  noRegister: string;
  nppPelapor?: string;
  namaPelapor?: string;
  perusahaanBiro?: string;
  tanggal?: string;
  lokasi?: string;
  areaTemuan?: string;
  keterangan?: string;
  fotoUrl?: string;
  kategori?: string;
  sumberTemuan?: string;
  picDepartemen?: string;
  kriteriaKtaTta?: string;
  perusahaanPengelola?: string;
  tindakLanjutLangsung?: string;
  statusTindakLanjut?: string;
  biro?: string;
  dueDate?: string;
  updateStatus?: string;
  createdAt: string;
  creator?: {
    username: string;
    role: string;
  };
}

interface KtaTtaReviewProps {
  user: User;
  dataType: "KTA_TTA" | "KPI_UTAMA";
}

export function KtaTtaReview({ user, dataType }: KtaTtaReviewProps) {
  const [data, setData] = useState<KtaTtaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [picFilter, setPicFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Check access permission
  const hasAccess = hasDataAccess();
  const [allowedPIC, setAllowedPIC] = useState<string[]>([]);

  // Load allowed PIC
  useEffect(() => {
    const loadPIC = async () => {
      const pics = await getAllowedPIC(user.role, user.department);
      setAllowedPIC(pics);
    };
    loadPIC();
  }, [user.role, user.department]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        ...(picFilter && { picDepartemen: picFilter }),
        ...(statusFilter && { statusUpdate: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/kta-tta?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        console.error("Failed to fetch data:", result.error);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [picFilter, statusFilter, searchTerm]);

  useEffect(() => {
    if (hasAccess) {
      fetchData();
    }
  }, [hasAccess, fetchData]);

  const handleExportData = async () => {
    try {
      const response = await fetch(`/api/kta-tta/export`);
      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_kta_kpi_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Gagal mengekspor data");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/kta-tta?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete data");
      }

      setData((prev) => prev.filter((item) => item.id !== id));
      alert("Data berhasil dihapus");
    } catch (error) {
      console.error("Error deleting data:", error);
      alert("Gagal menghapus data");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setPicFilter("");
    setStatusFilter("");
  };

  if (!hasAccess) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Akses Terbatas</h3>
            <p className="text-muted-foreground">
              {dataType === "KPI_UTAMA"
                ? "Fitur KPI Utama hanya tersedia untuk MTC&ENG Bureau."
                : "Fitur KTA & TTA tidak tersedia untuk MTC&ENG Bureau."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const Icon = dataType === "KTA_TTA" ? FileSpreadsheet : BarChart3;
  const title = dataType === "KTA_TTA" ? "KTA & TTA" : "KPI Utama";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Icon className="w-5 h-5" />
              <span>Data {title}</span>
              <Badge variant="outline">{data.length} Records</Badge>
            </CardTitle>

            <div className="flex items-center space-x-2">
              {data.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari berdasarkan nomor register, nama pelapor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {allowedPIC.length > 1 && (
              <Select value={picFilter} onValueChange={setPicFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter PIC" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua PIC</SelectItem>
                  {allowedPIC.map((pic) => (
                    <SelectItem key={pic} value={pic}>
                      {pic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="CLOSE">Close</SelectItem>
              </SelectContent>
            </Select>

            {(searchTerm || picFilter || statusFilter) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No Register
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NPP Pelapor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Pelapor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PIC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  data.map((record: KtaTtaRecord) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.noRegister}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.nppPelapor || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.namaPelapor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.picDepartemen}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            record.statusTindakLanjut === "OPEN"
                              ? "destructive"
                              : "default"
                          }
                        >
                          {record.statusTindakLanjut}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(record.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
