"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Session } from "next-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Calendar,
  Loader2,
  Plus,
} from "lucide-react";

// Custom hook for debounced search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface DataCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  table: string;
  filter?: string;
  departmentSpecific?: string;
}

// Generic record interface for different data types
interface BaseRecord {
  id: string | number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: unknown;
}

// Specific record interfaces for different categories
interface OperationalReport extends BaseRecord {
  reportDate: string | Date;
  equipmentName?: string;
  equipmentCode?: string;
  departmentName?: string;
  departmentId?: number;
  totalWorking?: number;
  totalStandby?: number;
  totalBreakdown?: number;
  isComplete?: boolean;
}

interface KtaTtaRecord extends BaseRecord {
  tanggal: string | Date;
  keterangan?: string;
  noRegister?: string;
  departmentName?: string;
  picDepartemenId?: number;
  namaPelapor?: string;
  nppPelapor?: string;
  statusTindakLanjut?: string;
}

interface MaintenanceRecord extends BaseRecord {
  startDate: string | Date;
  endDate?: string | Date;
  jobName: string;
  uniqueNumber?: string;
  departmentName?: string;
  departmentId?: number;
  type?: string;
}

interface CriticalIssue extends BaseRecord {
  issueName: string;
  description?: string;
  departmentName?: string;
  departmentId?: number;
  status?: string;
}

interface SafetyIncident extends BaseRecord {
  month: number;
  year: number;
  nearmiss: number;
  kecAlat: number;
  kecKecil: number;
  kecRingan: number;
  kecBerat: number;
  fatality: number;
}

interface EnergyTarget extends BaseRecord {
  year: number;
  month: number;
  ikesTarget?: number;
  emissionTarget?: number;
}

interface EnergyConsumption extends BaseRecord {
  year: number;
  month: number;
  plnConsumption: number;
  tambangConsumption: number;
  pabrikConsumption: number;
  supportingConsumption: number;
}

interface DataCategoryTableProps {
  category: DataCategory;
  globalSearch: string;
  session: Session;
  onEdit: (recordId: number) => void;
  onDelete?: (recordId: number) => void;
  canEdit: boolean;
  departments: Department[];
}

export function DataCategoryTable({
  category,
  globalSearch,
  session,
  onDelete,
  canEdit,
  departments,
}: DataCategoryTableProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BaseRecord[]>([]);
  const [filteredData, setFilteredData] = useState<BaseRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [localSearch, setLocalSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Debounce search to prevent excessive filtering
  const debouncedLocalSearch = useDebounce(localSearch, 300);
  const debouncedGlobalSearch = useDebounce(globalSearch || "", 300);

  const pageSize = 10;
  const totalPages = Math.ceil(totalRecords / pageSize);

  // Load data for this category
  const loadData = useCallback(async (): Promise<void> => {
    if (!category.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        category: category.id,
      });

      if (category.filter) {
        queryParams.append("filter", category.filter);
      }

      console.log(
        `Loading data for category: ${category.id}, page: ${currentPage}, pageSize: ${pageSize}`
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(
        `/api/data-review/category?${queryParams.toString()}`,
        {
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();
      setData(result.data || []);
      setTotalRecords(result.total || 0);

      console.log(
        `Successfully loaded ${result.data?.length || 0} records for ${
          category.id
        }`
      );
    } catch (err) {
      console.error(`Failed to load ${category.id} data:`, err);

      if (err instanceof Error && err.name === "AbortError") {
        setError("Request timeout - data loading took too long");
      } else {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      }

      setData([]);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  }, [category.id, category.filter, currentPage]);

  // Reset to page 1 when category changes
  useEffect(() => {
    if (category.id) {
      setCurrentPage(1);
    }
  }, [category.id]);

  // Load data when dependencies change
  useEffect(() => {
    if (category.id) {
      loadData();
    }
  }, [category.id, currentPage, loadData]);

  // Apply search filters with debounced search
  useEffect(() => {
    let filtered = data;

    const searchTerm = debouncedGlobalSearch || debouncedLocalSearch;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = data.filter((item) =>
        Object.values(item).some(
          (value) =>
            value && value.toString().toLowerCase().includes(searchLower)
        )
      );
    }

    setFilteredData(filtered);
  }, [data, debouncedGlobalSearch, debouncedLocalSearch]);

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString.toString();
    }
  };

  const formatDateTime = (dateString: string | Date | undefined) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString.toString();
    }
  };

  const getDepartmentName = (departmentId: number) => {
    const dept = departments.find((d) => d.id === departmentId);
    return dept?.name || `Dept ${departmentId}`;
  };

  // Handle Edit - redirect to proper input form with correct tab names
  const handleEdit = (record: BaseRecord) => {
    console.log(`Editing ${category.id} record:`, record);

    // Map category to department and FEATURE KEY (not custom tab names)
    const routeMapping = {
      "operational-reports": { dept: "mmtc", feature: "DAILY_ACTIVITY" },
      "kta-tta": { dept: "mmtc", feature: "KTA_TTA" },
      "kpi-utama": { dept: "mtc-eng-bureau", feature: "KPI_UTAMA" },
      "maintenance-routine": { dept: "mmtc", feature: "MAINTENANCE_ROUTINE" },
      "critical-issues": { dept: "mmtc", feature: "CRITICAL_ISSUE" },
      "safety-incidents": {
        dept: "mtc-eng-bureau",
        feature: "SAFETY_INCIDENT",
      },
      "energy-targets": { dept: "mtc-eng-bureau", feature: "ENERGY_IKES" },
      "energy-consumption": {
        dept: "mtc-eng-bureau",
        feature: "ENERGY_CONSUMPTION",
      },
    };

    const mapping = routeMapping[category.id as keyof typeof routeMapping];
    if (mapping) {
      // Use feature key as tab value, not custom names
      const url = `/input/${mapping.dept}?tab=${mapping.feature}&edit=${record.id}`;
      console.log(`Redirecting to: ${url}`);
      console.log(`Feature: ${mapping.feature} (not custom tab name)`);
      router.push(url);
    } else {
      alert(
        `Edit untuk ${category.name} belum tersedia. Route mapping: ${category.id}`
      );
    }
  };

  // Handle Delete with confirmation
  const handleDelete = async (record: BaseRecord) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus data ini?\n\n${category.name}: ${record.id}\n\nTindakan ini tidak dapat dibatalkan.`
      )
    ) {
      return;
    }

    setDeletingId(record.id as number);

    try {
      console.log(`Deleting ${category.id} record ${record.id}`);

      const response = await fetch(
        `/api/data-review/${category.id}/${record.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Success - refresh data
      await loadData();
      alert(`Data ${category.name} berhasil dihapus!`);
    } catch (error) {
      console.error("Delete error:", error);
      alert(
        `Gagal menghapus data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setDeletingId(null);
    }
  };

  const renderTableContent = () => {
    if (isLoading) {
      return (
        <>
          {/* Loading skeleton rows */}
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={`skeleton-${index}`}>
              <TableCell colSpan={6} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="animate-pulse flex space-x-4 w-full">
                    <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </>
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-12">
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div className="text-sm text-destructive text-center">
                <div className="font-medium">Error loading {category.name}</div>
                <div className="text-xs mt-1">{error}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Coba Lagi
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (filteredData.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-12">
            <div className="text-muted-foreground">
              {data.length === 0 ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="text-4xl">📭</div>
                  <div className="font-medium">
                    Belum ada data {category.name}
                  </div>
                  <div className="text-sm">
                    Data akan muncul setelah Anda menginput dari halaman Input
                    Data
                  </div>
                  {session.user.role !== "VIEWER" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/input")}
                      className="mt-2 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Data Pertama
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="text-4xl">🔍</div>
                  <div className="font-medium">Tidak ada data yang cocok</div>
                  <div className="text-sm">
                    Tidak ditemukan data yang sesuai dengan pencarian &quot;
                    {globalSearch || localSearch}&quot;
                  </div>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return filteredData.map((record, index) => (
      <TableRow key={record.id || index} className="hover:bg-muted/50">
        {/* Render columns based on category */}
        {renderRowCells(record)}

        {/* Actions - ONLY Edit and Delete */}
        <TableCell>
          <div className="flex items-center gap-1">
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(record)}
                className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                title="Edit Data"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(record)}
                disabled={deletingId === record.id}
                className="h-8 w-8 p-0 text-destructive hover:bg-red-100 hover:text-red-700"
                title="Hapus Data"
              >
                {deletingId === record.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  const renderRowCells = (record: BaseRecord) => {
    switch (category.id) {
      case "operational-reports": {
        const opRecord = record as OperationalReport;
        return (
          <>
            <TableCell>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                {formatDate(opRecord.reportDate)}
              </div>
            </TableCell>
            <TableCell>
              <div>
                <div className="font-medium">
                  {opRecord.equipmentName || "Unknown Equipment"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {opRecord.equipmentCode}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {opRecord.departmentName ||
                  getDepartmentName(opRecord.departmentId || 0)}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <span className="text-green-600">
                  W: {opRecord.totalWorking || 0}h
                </span>
                {" | "}
                <span className="text-yellow-600">
                  S: {opRecord.totalStandby || 0}h
                </span>
                {" | "}
                <span className="text-red-600">
                  B: {opRecord.totalBreakdown || 0}h
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={opRecord.isComplete ? "default" : "secondary"}>
                {opRecord.isComplete ? "Complete" : "Draft"}
              </Badge>
            </TableCell>
          </>
        );
      }

      case "kta-tta":
      case "kpi-utama": {
        const ktaRecord = record as KtaTtaRecord;
        return (
          <>
            <TableCell>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                {formatDate(ktaRecord.tanggal)}
              </div>
            </TableCell>
            <TableCell>
              <div className="max-w-xs">
                <div className="font-medium truncate">
                  {ktaRecord.keterangan || "No description"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {ktaRecord.noRegister}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {ktaRecord.departmentName ||
                  getDepartmentName(ktaRecord.picDepartemenId || 0)}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <div>{ktaRecord.namaPelapor || "-"}</div>
                <div className="text-xs text-muted-foreground">
                  {ktaRecord.nppPelapor}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  ktaRecord.statusTindakLanjut === "Complete"
                    ? "default"
                    : "secondary"
                }
              >
                {ktaRecord.statusTindakLanjut || "Pending"}
              </Badge>
            </TableCell>
          </>
        );
      }

      case "maintenance-routine": {
        const mainRecord = record as MaintenanceRecord;
        return (
          <>
            <TableCell>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                {formatDate(mainRecord.startDate)}
              </div>
            </TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{mainRecord.jobName}</div>
                <div className="text-xs text-muted-foreground">
                  {mainRecord.uniqueNumber}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {mainRecord.departmentName ||
                  getDepartmentName(mainRecord.departmentId || 0)}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                {mainRecord.endDate
                  ? `${formatDate(mainRecord.startDate)} - ${formatDate(
                      mainRecord.endDate
                    )}`
                  : `Mulai: ${formatDate(mainRecord.startDate)}`}
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant={mainRecord.type === "PREM" ? "default" : "secondary"}
              >
                {mainRecord.type === "PREM" ? "Preventive" : "Corrective"}
              </Badge>
            </TableCell>
          </>
        );
      }

      case "critical-issues": {
        const criticalRecord = record as CriticalIssue;
        return (
          <>
            <TableCell>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                {formatDateTime(criticalRecord.createdAt)}
              </div>
            </TableCell>
            <TableCell>
              <div className="font-medium">{criticalRecord.issueName}</div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {criticalRecord.departmentName ||
                  getDepartmentName(criticalRecord.departmentId || 0)}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="max-w-xs">
                <div className="text-sm truncate">
                  {criticalRecord.description}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  criticalRecord.status === "WORKING"
                    ? "default"
                    : criticalRecord.status === "STANDBY"
                    ? "secondary"
                    : "destructive"
                }
              >
                {criticalRecord.status}
              </Badge>
            </TableCell>
          </>
        );
      }

      case "safety-incidents": {
        const safetyRecord = record as SafetyIncident;
        return (
          <>
            <TableCell>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                {safetyRecord.month}/{safetyRecord.year}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <div>Near Miss: {safetyRecord.nearmiss}</div>
                <div>Kec. Alat: {safetyRecord.kecAlat}</div>
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <div>Kec. Kecil: {safetyRecord.kecKecil}</div>
                <div>Kec. Ringan: {safetyRecord.kecRingan}</div>
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <div>Kec. Berat: {safetyRecord.kecBerat}</div>
                <div>Fatality: {safetyRecord.fatality}</div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">MTC&ENG Bureau</Badge>
            </TableCell>
          </>
        );
      }

      case "energy-targets": {
        const energyRecord = record as EnergyTarget;
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "Mei",
          "Jun",
          "Jul",
          "Ags",
          "Sep",
          "Okt",
          "Nov",
          "Des",
        ];
        return (
          <>
            <TableCell>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">
                  {monthNames[energyRecord.month - 1]} {energyRecord.year}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <div className="font-medium text-blue-600">IKES Target</div>
                <div className="text-lg font-semibold">
                  {energyRecord.ikesTarget
                    ? energyRecord.ikesTarget.toLocaleString("id-ID", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "-"}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <div className="font-medium text-green-600">
                  Emission Target
                </div>
                <div className="text-lg font-semibold">
                  {energyRecord.emissionTarget
                    ? energyRecord.emissionTarget.toLocaleString("id-ID", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "-"}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                MTC&ENG Bureau
              </Badge>
            </TableCell>
            <TableCell>
              <div className="text-xs text-muted-foreground">
                {formatDateTime(energyRecord.createdAt)}
              </div>
            </TableCell>
          </>
        );
      }

      case "energy-consumption": {
        const consumptionRecord = record as EnergyConsumption;
        return (
          <>
            <TableCell>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                {String(consumptionRecord.month).padStart(2, "0")}/
                {consumptionRecord.year}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <div>
                  PLN: {consumptionRecord.plnConsumption.toFixed(2)} MWh
                </div>
                <div>
                  Tambang: {consumptionRecord.tambangConsumption.toFixed(2)} MWh
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <div>
                  Pabrik: {consumptionRecord.pabrikConsumption.toFixed(2)} MWh
                </div>
                <div>
                  Supporting:{" "}
                  {consumptionRecord.supportingConsumption.toFixed(2)} MWh
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm font-medium">
                Total:{" "}
                {(
                  consumptionRecord.plnConsumption +
                  consumptionRecord.tambangConsumption +
                  consumptionRecord.pabrikConsumption +
                  consumptionRecord.supportingConsumption
                ).toFixed(2)}{" "}
                MWh
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">MTC&ENG Bureau</Badge>
            </TableCell>
          </>
        );
      }

      default:
        return (
          <>
            <TableCell>{record.id}</TableCell>
            <TableCell>
              {formatDateTime(record.createdAt || record.updatedAt)}
            </TableCell>
            <TableCell>-</TableCell>
            <TableCell>-</TableCell>
            <TableCell>-</TableCell>
          </>
        );
    }
  };

  const renderTableHeaders = () => {
    switch (category.id) {
      case "operational-reports":
        return (
          <>
            <TableHead>Tanggal</TableHead>
            <TableHead>Alat</TableHead>
            <TableHead>Departemen</TableHead>
            <TableHead>Hours (W|S|B)</TableHead>
            <TableHead>Status</TableHead>
          </>
        );

      case "kta-tta":
      case "kpi-utama":
        return (
          <>
            <TableHead>Tanggal</TableHead>
            <TableHead>Keterangan</TableHead>
            <TableHead>Departemen</TableHead>
            <TableHead>Pelapor</TableHead>
            <TableHead>Status</TableHead>
          </>
        );

      case "maintenance-routine":
        return (
          <>
            <TableHead>Tanggal</TableHead>
            <TableHead>Pekerjaan</TableHead>
            <TableHead>Departemen</TableHead>
            <TableHead>Periode</TableHead>
            <TableHead>Tipe</TableHead>
          </>
        );

      case "critical-issues":
        return (
          <>
            <TableHead>Waktu</TableHead>
            <TableHead>Masalah</TableHead>
            <TableHead>Departemen</TableHead>
            <TableHead>Keterangan</TableHead>
            <TableHead>Status</TableHead>
          </>
        );

      case "safety-incidents":
        return (
          <>
            <TableHead>Periode</TableHead>
            <TableHead>Kategori 1</TableHead>
            <TableHead>Kategori 2</TableHead>
            <TableHead>Kategori 3</TableHead>
            <TableHead>Departemen</TableHead>
          </>
        );

      case "energy-targets":
        return (
          <>
            <TableHead>Periode</TableHead>
            <TableHead>IKES Target</TableHead>
            <TableHead>Emission Target</TableHead>
            <TableHead>Departemen</TableHead>
            <TableHead>Created</TableHead>
          </>
        );

      case "energy-consumption":
        return (
          <>
            <TableHead>Periode</TableHead>
            <TableHead>PLN & Tambang</TableHead>
            <TableHead>Pabrik & Supporting</TableHead>
            <TableHead>Total Konsumsi</TableHead>
            <TableHead>Departemen</TableHead>
          </>
        );

      default:
        return (
          <>
            <TableHead>ID</TableHead>
            <TableHead>Waktu</TableHead>
            <TableHead>Col 1</TableHead>
            <TableHead>Col 2</TableHead>
            <TableHead>Col 3</TableHead>
          </>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Local Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={`Cari dalam ${category.name}...`}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-2 w-2 border-b border-primary"></div>
                <span>Loading...</span>
              </>
            ) : error ? (
              <>
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>Error</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Ready</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {renderTableHeaders()}
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderTableContent()}</TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Menampilkan {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, totalRecords)} dari{" "}
            {totalRecords.toLocaleString("id-ID")} data
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={isLoading}
                    className="h-8 w-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
