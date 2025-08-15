"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Clock,
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

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ManageDataTableProps {
  items: ManageDataItem[];
  pagination: Pagination;
  onEdit: (item: ManageDataItem) => void;
  onDelete: (item: ManageDataItem) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  getTypeIcon: (type: string) => React.JSX.Element;
  getTypeLabel: (type: string) => string;
}

export function ManageDataTable({
  items,
  pagination,
  onEdit,
  onDelete,
  onPageChange,
  onPageSizeChange,
  getTypeIcon,
  getTypeLabel,
}: ManageDataTableProps): React.JSX.Element {
  const { data: session } = useSession();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRowExpansion = (id: number): void => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status?: string): React.JSX.Element | null => {
    if (!status) return null;

    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon?: React.JSX.Element }> = {
      // General statuses
      "Complete": { variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
      "Draft": { variant: "outline", icon: <Clock className="h-3 w-3" /> },
      "Active": { variant: "default" },
      
      // Critical issue statuses
      "INVESTIGASI": { variant: "outline", icon: <AlertCircle className="h-3 w-3" /> },
      "PROSES": { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
      "SELESAI": { variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
      
      // KTA/TTA statuses
      "OPEN": { variant: "destructive", icon: <AlertCircle className="h-3 w-3" /> },
      "CLOSE": { variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
      
      // Maintenance types
      "PREM": { variant: "default" },
      "CORM": { variant: "secondary" },
    };

    const config = statusConfig[status] || { variant: "outline" as const };

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  const renderDataPreview = (item: ManageDataItem): React.JSX.Element => {
    const isExpanded = expandedRows.has(item.id);
    
    if (!isExpanded) {
      // Show truncated preview
      const previewText = Object.entries(item.data)
        .slice(0, 2)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
      
      return (
        <div className="max-w-xs">
          <p className="text-sm text-muted-foreground truncate">
            {previewText}...
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleRowExpansion(item.id)}
            className="h-auto p-0 text-blue-600 hover:text-blue-800"
          >
            Lihat detail
          </Button>
        </div>
      );
    }

    // Show full data
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(item.data).map(([key, value]) => (
            <div key={key} className="flex flex-col">
              <span className="font-medium text-muted-foreground capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}:
              </span>
              <span className="break-words">
                {value instanceof Date ? 
                  value.toLocaleDateString("id-ID") : 
                  String(value || "-")
                }
              </span>
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleRowExpansion(item.id)}
          className="h-auto p-0 text-blue-600 hover:text-blue-800"
        >
          Sembunyikan detail
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[250px]">Judul & Jenis</TableHead>
              <TableHead className="w-[120px]">Departemen</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[120px]">Dibuat</TableHead>
              <TableHead className="w-[120px]">Terakhir Update</TableHead>
              <TableHead className="min-w-[200px]">Data</TableHead>
              <TableHead className="w-[80px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow
                key={`${item.type}-${item.id}`}
                className="hover:bg-muted/50"
              >
                <TableCell>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="font-medium leading-none truncate cursor-help">
                              {item.title}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{item.title}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <p className="text-xs text-muted-foreground">
                        {getTypeLabel(item.type)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {item.department}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  {getStatusBadge(item.status)}
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-sm">{formatDate(item.createdAt)}</p>
                    <p className="text-xs text-muted-foreground">
                      oleh {item.createdBy}
                    </p>
                  </div>
                </TableCell>
                
                <TableCell>
                  <p className="text-sm">{formatDate(item.updatedAt)}</p>
                </TableCell>
                
                <TableCell>
                  {renderDataPreview(item)}
                </TableCell>
                
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Buka menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => toggleRowExpansion(item.id)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        {expandedRows.has(item.id) ? "Sembunyikan" : "Lihat Detail"}
                      </DropdownMenuItem>
                      
                      {item.canEdit && (
                        <DropdownMenuItem
                          onClick={() => onEdit(item)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                          {session?.user.role === "INPUTTER" && (
                            <span className="text-xs text-orange-600">(Perlu Approval)</span>
                          )}
                        </DropdownMenuItem>
                      )}
                      
                      {item.canDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(item)}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <DataTablePagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          hasNextPage={pagination.page < pagination.totalPages}
          hasPrevPage={pagination.page > 1}
          onPageChange={onPageChange}
          pageSize={pagination.pageSize}
          onPageSizeChange={onPageSizeChange}
        />
      )}

      {/* Role-based info */}
      {session?.user.role === "INPUTTER" && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-orange-800">
                Catatan untuk Inputter
              </p>
              <p className="text-sm text-orange-700">
                Semua perubahan yang Anda lakukan akan diajukan ke sistem approval terlebih dahulu. 
                Planner atau Admin akan meninjau dan menyetujui perubahan Anda.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
