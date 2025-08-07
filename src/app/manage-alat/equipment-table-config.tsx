"use client";

import { Badge } from "@/components/ui/badge";

import { Edit, Trash2 } from "lucide-react";
import { dateUtils } from "@/lib/utils";
import { TableColumn, TableAction, TableFilter } from "@/components/ui/universal-table";

interface Equipment {
  id: number;
  name: string;
  code: string;
  categoryId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: number;
    name: string;
    code: string;
  };
  currentStatus: string;
  lastStatusChange: string;
  lastChangedBy: string;
  _count: {
    operationalReports: number;
  };
}

interface Category {
  id: number;
  name: string;
  code: string;
  _count: {
    equipment: number;
  };
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case "WORKING":
      return "bg-green-100 text-green-800 border-green-200";
    case "BREAKDOWN":
      return "bg-red-100 text-red-800 border-red-200";
    case "MAINTENANCE":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const createEquipmentColumns = (): TableColumn<Equipment>[] => [
  {
    key: "name",
    label: "Nama Equipment",
    render: (value: unknown, equipment: Equipment): React.JSX.Element => (
      <div className="flex flex-col">
        <span className="font-medium">{equipment.name}</span>
        <span className="sm:hidden text-xs text-muted-foreground">
          {equipment.code}
        </span>
      </div>
    ),
  },
  {
    key: "code",
    label: "Kode",
    className: "hidden sm:table-cell",
    render: (value: unknown, equipment: Equipment): React.JSX.Element => (
      <code className="text-xs bg-muted px-2 py-1 rounded">
        {equipment.code}
      </code>
    ),
  },
  {
    key: "category",
    label: "Kategori",
    className: "hidden md:table-cell",
    render: (value: unknown, equipment: Equipment): React.JSX.Element => (
      <Badge variant="outline">{equipment.category.name}</Badge>
    ),
  },
  {
    key: "currentStatus",
    label: "Status",
    render: (value: unknown, equipment: Equipment): React.JSX.Element => (
      <Badge className={getStatusColor(equipment.currentStatus)}>
        <span className="hidden sm:inline">{equipment.currentStatus}</span>
        <span className="sm:hidden">{equipment.currentStatus.charAt(0)}</span>
      </Badge>
    ),
  },
  {
    key: "lastStatusChange",
    label: "Last Update",
    className: "hidden lg:table-cell",
    render: (value: unknown, equipment: Equipment): React.JSX.Element => (
      <span className="text-sm text-muted-foreground">
        {dateUtils.formatDateTime(equipment.lastStatusChange)}
      </span>
    ),
  },
];

export const createEquipmentActions = (
  onEdit: (equipment: Equipment) => void,
  onDelete: (id: number) => void
): TableAction<Equipment>[] => [
  {
    label: "Edit",
    icon: Edit,
    variant: "outline",
    size: "sm",
    className: "h-8 w-8 p-0",
    onClick: (equipment: Equipment): void => onEdit(equipment),
  },
  {
    label: "Delete",
    icon: Trash2,
    variant: "outline",
    size: "sm",
    className: "h-8 w-8 p-0",
    onClick: (equipment: Equipment): void => onDelete(equipment.id),
    disabled: (equipment: Equipment): boolean => equipment._count.operationalReports > 0,
  },
];

export const createEquipmentFilters = (
  categories: Category[],
  categoryFilter: string,
  setCategoryFilter: (value: string) => void
): TableFilter[] => [
  {
    key: "categoryId",
    label: "Filter Kategori",
    type: "select" as const,
    placeholder: "Pilih Kategori",
    value: categoryFilter,
    onChange: setCategoryFilter,
    options: [
      { value: "all", label: "Semua Kategori" },
      ...categories.map((category) => ({
        value: category.id.toString(),
        label: category.name,
      })),
    ],
  }
];

// ✅ CATEGORY TABLE CONFIGURATION
export function createCategoryColumns(): TableColumn<Category>[] {
  return [
    {
      key: "name",
      label: "Nama Kategori",
      width: "300px",
      render: (value) => (
        <span className="font-medium">{value as string}</span>
      ),
    },
    {
      key: "code",
      label: "Kode",
      width: "150px",
      render: (value) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {value as string}
        </code>
      ),
    },
    {
      key: "_count.equipment",
      label: "Jumlah Equipment",
      width: "150px",
      align: "center",
      render: (_, row) => (
        <Badge variant="outline">
          {(row as Category)._count.equipment}
        </Badge>
      ),
    },
  ];
}

export function createCategoryActions(
  onEdit: (category: Category) => void,
  onDelete: (categoryId: number) => void
): TableAction<Category>[] {
  return [
    {
      label: "Edit",
      icon: Edit,
      variant: "outline",
      onClick: (row) => onEdit(row),
    },
    {
      label: "Delete",
      icon: Trash2,
      variant: "outline",
      onClick: (row) => onDelete(row.id),
      disabled: (row) => row._count.equipment > 0,
    },
  ];
}

export function createCategoryFilters(
  searchTerm: string,
  onSearchChange: (value: string) => void
): TableFilter[] {
  return [
    {
      key: "search",
      label: "Cari Kategori",
      type: "search",
      placeholder: "Cari berdasarkan nama atau kode...",
      value: searchTerm,
      onChange: onSearchChange,
    },
  ];
}