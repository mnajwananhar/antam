"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ManageDataTable } from "./manage-data-table";
import { ManageDataFilters } from "./manage-data-filters";
import { ManageDataEditDialog } from "./manage-data-edit-dialog";
import {
  Database,
  FileText,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface ManageDataItem {
  id: number;
  type: string;
  title: string;
  department: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status?: string;
  canEdit: boolean;
  canDelete: boolean;
  data: Record<string, unknown>;
}

interface FilterOptions {
  types: Array<{ value: string; label: string; count: number }>;
  departments: Array<{ value: string; label: string; count: number }>;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}


export function ManageDataClient(): React.JSX.Element {
  const { data: session } = useSession();
  const [items, setItems] = useState<ManageDataItem[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    types: [],
    departments: [],
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Filter states
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Edit dialog state
  const [editingItem, setEditingItem] = useState<ManageDataItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const loadManageData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(selectedType && { type: selectedType }),
        ...(selectedDepartment && { department: selectedDepartment }),
        ...(searchQuery && { search: searchQuery }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await fetch(`/api/manage-data?${params}`);

      if (response.ok) {
        const result = await response.json();
        setItems(result.data || []);
        setPagination(result.pagination);
        setFilters(result.filters);
        
        setMessage(null);
      } else {
        const error = await response.json();
        console.error("Failed to load manage data:", error);
        setMessage({
          type: "error",
          text: error.error || "Gagal memuat data",
        });
      }
    } catch (error) {
      console.error("Error loading manage data:", error);
      setMessage({
        type: "error",
        text: "Error saat memuat data",
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize, selectedType, selectedDepartment, searchQuery, startDate, endDate]);

  useEffect(() => {
    loadManageData();
  }, [loadManageData]);

  const handleEdit = (item: ManageDataItem): void => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (item: ManageDataItem): Promise<void> => {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${item.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/manage-data/${item.type}/${item.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({
          type: "success",
          text: result.message,
        });
        loadManageData(); // Reload data
      } else {
        const error = await response.json();
        setMessage({
          type: "error",
          text: error.error || "Gagal menghapus data",
        });
      }
    } catch (error) {
      console.error("Error deleting data:", error);
      setMessage({
        type: "error",
        text: "Error saat menghapus data",
      });
    }
  };

  const handleSaveEdit = async (data: Record<string, unknown>): Promise<void> => {
    if (!editingItem) return;

    try {
      const response = await fetch(`/api/manage-data/${editingItem.type}/${editingItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({
          type: "success",
          text: result.message,
        });
        setIsEditDialogOpen(false);
        setEditingItem(null);
        loadManageData(); // Reload data
      } else {
        const error = await response.json();
        setMessage({
          type: "error",
          text: error.error || "Gagal menyimpan perubahan",
        });
      }
    } catch (error) {
      console.error("Error saving edit:", error);
      setMessage({
        type: "error",
        text: "Error saat menyimpan perubahan",
      });
    }
  };

  const handlePageChange = (page: number): void => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number): void => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }));
  };

  const handleFiltersChange = (newFilters: {
    type?: string;
    department?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): void => {
    if (newFilters.type !== undefined) setSelectedType(newFilters.type);
    if (newFilters.department !== undefined) setSelectedDepartment(newFilters.department);
    if (newFilters.search !== undefined) setSearchQuery(newFilters.search);
    if (newFilters.startDate !== undefined) setStartDate(newFilters.startDate);
    if (newFilters.endDate !== undefined) setEndDate(newFilters.endDate);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = (): void => {
    setSelectedType("");
    setSelectedDepartment("");
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getTypeIcon = (type: string): React.JSX.Element => {
    switch (type) {
      case "operational_report":
        return <FileText className="h-5 w-5 text-blue-600" />;
      case "critical_issue":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "maintenance_routine":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      default:
        return <Database className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string): string => {
    const typeLabels: Record<string, string> = {
      operational_report: "Aktivitas Harian",
      kta_tta: "KTA & TTA",
      critical_issue: "Critical Issue",
      maintenance_routine: "Maintenance Rutin",
      safety_incident: "Insiden Keselamatan",
      energy_realization: "IKES & Emisi",
      energy_consumption: "Konsumsi Energi",
    };
    return typeLabels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Database className="h-6 w-6 flex-shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold truncate">Kelola Data</h1>
            <p className="text-sm text-muted-foreground">
              Monitor semua data input operasional sistem
            </p>
          </div>
        </div>
      </div>


      {/* Filters */}
      <ManageDataFilters
        filters={filters}
        selectedType={selectedType}
        selectedDepartment={selectedDepartment}
        searchQuery={searchQuery}
        startDate={startDate}
        endDate={endDate}
        onFiltersChange={handleFiltersChange}
        onClearFilters={clearFilters}
      />

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Kelola semua data input dari berbagai departemen dan fitur sistem
            {session?.user.role === "INPUTTER" && (
              <span className="block mt-1 text-sm text-orange-600">
                Perubahan yang Anda buat akan diajukan untuk persetujuan terlebih dahulu
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton 
              columns={8}
              rows={6}
              showSearch={false}
              showFilters={false}
              showPagination={true}
            />
          ) : items.length > 0 ? (
            <ManageDataTable
              items={items}
              pagination={pagination}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              getTypeIcon={getTypeIcon}
              getTypeLabel={getTypeLabel}
            />
          ) : (
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Tidak Ada Data
              </h3>
              <p className="text-muted-foreground">
                Tidak ada data yang sesuai dengan filter yang dipilih
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingItem && (
        <ManageDataEditDialog
          item={editingItem}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSaveEdit}
          getTypeLabel={getTypeLabel}
        />
      )}
    </div>
  );
}
