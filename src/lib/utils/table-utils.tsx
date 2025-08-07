import React from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, CheckCircle, XCircle } from "lucide-react";
import type { TableColumn, TableAction } from "@/components/ui/universal-table";

// ✅ COMMON COLUMN RENDERERS
export const tableRenderers = {
  // Date renderer dengan format Indonesia
  date: (value: unknown): React.ReactNode => {
    if (!value) return "-";
    try {
      const date = typeof value === "string" ? new Date(value) : value as Date;
      return format(date, "dd MMM yyyy", { locale: id });
    } catch {
      return "-";
    }
  },

  // DateTime renderer dengan format Indonesia
  datetime: (value: unknown): React.ReactNode => {
    if (!value) return "-";
    try {
      const date = typeof value === "string" ? new Date(value) : value as Date;
      return format(date, "dd MMM yyyy, HH:mm", { locale: id });
    } catch {
      return "-";
    }
  },

  // Status badge renderer
  status: (value: unknown, statusConfig?: Record<string, { label: string; variant: string }>): React.ReactNode => {
    if (!value) return "-";
    const status = String(value);
    const config = statusConfig?.[status] || { label: status, variant: "secondary" };
    
    return (
      <Badge variant={config.variant as "default" | "secondary" | "destructive" | "outline"}>
        {config.label}
      </Badge>
    );
  },

  // Boolean status dengan icon
  booleanStatus: (value: unknown): React.ReactNode => {
    if (value === null || value === undefined) return "-";
    const isActive = Boolean(value);
    
    return (
      <div className="flex items-center gap-2">
        {isActive ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <span>{isActive ? "Aktif" : "Tidak Aktif"}</span>
      </div>
    );
  },

  // Number dengan format Indonesia
  number: (value: unknown): React.ReactNode => {
    if (value === null || value === undefined) return "-";
    const num = Number(value);
    if (isNaN(num)) return "-";
    return num.toLocaleString("id-ID");
  },

  // Currency dengan format Rupiah
  currency: (value: unknown): React.ReactNode => {
    if (value === null || value === undefined) return "-";
    const num = Number(value);
    if (isNaN(num)) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(num);
  },

  // Truncated text dengan tooltip
  truncatedText: (value: unknown, maxLength = 50): React.ReactNode => {
    if (!value) return "-";
    const text = String(value);
    if (text.length <= maxLength) return text;
    
    return (
      <span title={text}>
        {text.substring(0, maxLength)}...
      </span>
    );
  },

  // User info dengan nama dan role
  userInfo: (value: unknown, row?: Record<string, unknown>): React.ReactNode => {
    if (!value && !row) return "-";
    
    const user = (value as Record<string, unknown>) || row;
    const username = String(user?.username || user?.name || "-");
    const role = user?.role ? String(user.role) : null;
    
    return (
      <div className="space-y-1">
        <div className="font-medium">{username}</div>
        {role && (
          <Badge variant="outline" className="text-xs">
            {role}
          </Badge>
        )}
      </div>
    );
  },
};

// ✅ COMMON ACTIONS
export const tableActions = {
  view: <T,>(onClick: (row: T) => void): TableAction<T> => ({
    label: "Lihat Detail",
    icon: Eye,
    onClick,
    variant: "ghost" as const,
  }),

  edit: <T,>(onClick: (row: T) => void, canEdit?: (row: T) => boolean): TableAction<T> => ({
    label: "Edit",
    icon: Edit,
    onClick,
    variant: "ghost" as const,
    disabled: canEdit ? (row) => !canEdit(row) : undefined,
  }),

  delete: <T,>(onClick: (row: T) => void, canDelete?: (row: T) => boolean): TableAction<T> => ({
    label: "Hapus",
    icon: Trash2,
    onClick,
    variant: "ghost" as const,
    disabled: canDelete ? (row) => !canDelete(row) : undefined,
    className: "text-destructive hover:text-destructive",
  }),
};

// ✅ COMMON COLUMNS
export const commonColumns = {
  index: <T,>(label = "No"): TableColumn<T> => ({
    key: "index",
    label,
    width: "60px",
    align: "center" as const,
    render: (_, __, index) => index + 1,
  }),

  id: <T,>(label = "ID"): TableColumn<T> => ({
    key: "id",
    label,
    width: "80px",
    align: "center" as const,
  }),

  createdAt: <T,>(label = "Dibuat"): TableColumn<T> => ({
    key: "createdAt",
    label,
    width: "120px",
    render: tableRenderers.datetime,
    sortable: true,
  }),

  updatedAt: <T,>(label = "Diperbarui"): TableColumn<T> => ({
    key: "updatedAt",
    label,
    width: "120px",
    render: tableRenderers.datetime,
    sortable: true,
  }),

  status: <T,>(label = "Status", statusConfig?: Record<string, { label: string; variant: string }>): TableColumn<T> => ({
    key: "status",
    label,
    width: "100px",
    align: "center" as const,
    render: (value) => tableRenderers.status(value, statusConfig),
  }),

  isActive: <T,>(label = "Status"): TableColumn<T> => ({
    key: "isActive",
    label,
    width: "120px",
    align: "center" as const,
    render: tableRenderers.booleanStatus,
  }),
};

// ✅ COMMON FILTERS
export const commonFilters = {
  status: (value: string, onChange: (value: string) => void, options: Array<{ value: string; label: string }>) => ({
    key: "status",
    label: "Status",
    type: "select" as const,
    value,
    onChange,
    options: [
      { value: "all", label: "Semua Status" },
      ...options,
    ],
  }),

  role: (value: string, onChange: (value: string) => void) => ({
    key: "role",
    label: "Role",
    type: "select" as const,
    value,
    onChange,
    options: [
      { value: "all", label: "Semua Role" },
      { value: "ADMIN", label: "Admin" },
      { value: "PLANNER", label: "Planner" },
      { value: "INPUTTER", label: "Inputter" },
      { value: "VIEWER", label: "Viewer" },
    ],
  }),

  activeStatus: (value: string, onChange: (value: string) => void) => ({
    key: "activeStatus",
    label: "Status Aktif",
    type: "select" as const,
    value,
    onChange,
    options: [
      { value: "all", label: "Semua" },
      { value: "active", label: "Aktif" },
      { value: "inactive", label: "Tidak Aktif" },
    ],
  }),
};

// ✅ UTILITY FUNCTIONS
export const tableUtils = {
  // Generate pagination info
  getPaginationInfo: (currentPage: number, pageSize: number, totalItems: number) => ({
    currentPage,
    totalPages: Math.ceil(totalItems / pageSize),
    pageSize,
    totalItems,
    startItem: (currentPage - 1) * pageSize + 1,
    endItem: Math.min(currentPage * pageSize, totalItems),
  }),

  // Filter data by search term
  filterBySearch: <T extends Record<string, unknown>>(
    data: T[],
    searchTerm: string,
    searchFields: (keyof T)[]
  ): T[] => {
    if (!searchTerm.trim()) return data;
    
    const term = searchTerm.toLowerCase();
    return data.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(term);
      })
    );
  },

  // Sort data by field
  sortData: <T extends Record<string, unknown>>(
    data: T[],
    sortBy: string,
    sortOrder: "asc" | "desc"
  ): T[] => {
    return [...data].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sortOrder === "desc" ? -comparison : comparison;
    });
  },

  // Paginate data
  paginateData: <T,>(data: T[], currentPage: number, pageSize: number): T[] => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  },
};

// ✅ STATUS CONFIGURATIONS
export const statusConfigs = {
  equipmentStatus: {
    OPERATIONAL: { label: "Operasional", variant: "success" },
    MAINTENANCE: { label: "Maintenance", variant: "warning" },
    BREAKDOWN: { label: "Breakdown", variant: "destructive" },
    STANDBY: { label: "Standby", variant: "secondary" },
  },
  
  ktaTtaStatus: {
    OPEN: { label: "Open", variant: "destructive" },
    CLOSE: { label: "Close", variant: "success" },
  },
  
  userRole: {
    ADMIN: { label: "Admin", variant: "destructive" },
    PLANNER: { label: "Planner", variant: "success" },
    INPUTTER: { label: "Inputter", variant: "warning" },
    VIEWER: { label: "Viewer", variant: "secondary" },
  },
};