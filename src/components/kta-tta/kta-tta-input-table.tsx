"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye,
  Calendar,
  User,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useToastContext } from "@/lib/hooks";

export interface KtaKpiItem {
  id: number;
  noRegister: string;
  nppPelapor?: string;
  namaPelapor?: string;
  perusahaanBiro?: string;
  tanggal?: Date | string;
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
  statusTindakLanjut?: "OPEN" | "CLOSE";
  biro?: string;
  dueDate?: Date | string;
  updateStatus?: string;
  dataType: "KTA_TTA" | "KPI_UTAMA";
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: {
    id: number;
    username: string;
    role: string;
  };
}

interface KtaKpiInputTableProps {
  data: KtaKpiItem[];
  isLoading?: boolean;
  dataType: "KTA_TTA" | "KPI_UTAMA";
  onStatusChange?: (id: number, newStatus: "OPEN" | "CLOSE") => void;
  onView?: (item: KtaKpiItem) => void;
  maxHeight?: string;
}

export function KtaKpiInputTable({
  data,
  isLoading = false,
  dataType,
  onStatusChange,
  onView,
  maxHeight = "500px",
}: KtaKpiInputTableProps) {
  const [selectedItem, setSelectedItem] = useState<KtaKpiItem | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());
  
  const { showSuccess, showError } = useToastContext();

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "-";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return format(dateObj, "dd MMM yyyy", { locale: id });
    } catch {
      return "-";
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return <Badge variant="secondary">-</Badge>;

    switch (status.toLowerCase()) {
      case "open":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Open
          </Badge>
        );
      case "close":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Close
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUpdateStatusBadge = (updateStatus: string | undefined) => {
    if (!updateStatus) return <Badge variant="secondary">-</Badge>;

    switch (updateStatus.toLowerCase()) {
      case "proses":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Proses
          </Badge>
        );
      case "close":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Close
          </Badge>
        );
      case "due date":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Due Date
          </Badge>
        );
      default:
        return <Badge variant="secondary">{updateStatus}</Badge>;
    }
  };

  const handleStatusChange = async (item: KtaKpiItem, newStatus: "OPEN" | "CLOSE") => {
    if (!onStatusChange) return;

    setUpdatingItems(prev => new Set(prev).add(item.id));
    try {
      await onStatusChange(item.id, newStatus);
      showSuccess(`Status berhasil diubah menjadi ${newStatus}`);
    } catch {
      showError("Gagal mengubah status");
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const handleView = (item: KtaKpiItem) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
    if (onView) {
      onView(item);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Memuat Data...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data {dataType === "KTA_TTA" ? "KTA & TTA" : "KPI Utama"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Data</h3>
            <p className="text-muted-foreground">
              Belum ada data {dataType === "KTA_TTA" ? "KTA & TTA" : "KPI Utama"} yang tersimpan.
              Upload file Excel untuk menambah data.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Data {dataType === "KTA_TTA" ? "KTA & TTA" : "KPI Utama"} ({data.length})</span>
            <Badge variant="outline">{data.length} records</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Fixed Width Table Container with Horizontal Scroll */}
          <div 
            className="border bg-background overflow-auto w-full max-w-[calc(100vw-32px)] md:max-w-[calc(100vw-320px)]"
            style={{ maxHeight }}
          >
            <Table className="w-max min-w-full">
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-32">No. Register</TableHead>
                  <TableHead className="w-24">Tanggal</TableHead>
                  <TableHead className="w-32">Pelapor</TableHead>
                  <TableHead className="w-32">Lokasi</TableHead>
                  <TableHead className="w-48">Keterangan</TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                  <TableHead className="w-28 text-center">Update Status</TableHead>
                  <TableHead className="w-24 text-center">Due Date</TableHead>
                  <TableHead className="w-32 text-center">Ubah Status</TableHead>
                  <TableHead className="w-20 text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">
                      {item.noRegister}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(item.tanggal)}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>
                        <div className="font-medium">{item.namaPelapor || "-"}</div>
                        <div className="text-muted-foreground">{item.nppPelapor || "-"}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>
                        <div>{item.lokasi || "-"}</div>
                        {item.areaTemuan && (
                          <div className="text-muted-foreground">({item.areaTemuan})</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="max-w-48 truncate" title={item.keterangan}>
                        {item.keterangan || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(item.statusTindakLanjut)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getUpdateStatusBadge(item.updateStatus)}
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      {formatDate(item.dueDate)}
                    </TableCell>
                    <TableCell className="text-center">
                      {onStatusChange && (
                        <Select
                          value={item.statusTindakLanjut || "OPEN"}
                          onValueChange={(value: "OPEN" | "CLOSE") => 
                            handleStatusChange(item, value)
                          }
                          disabled={updatingItems.has(item.id)}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OPEN">Open</SelectItem>
                            <SelectItem value="CLOSE">Close</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(item)}
                        className="h-8 w-8 p-0"
                        title="Lihat Detail"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detail {dataType === "KTA_TTA" ? "KTA & TTA" : "KPI Utama"}
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap data {selectedItem?.noRegister}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    No. Register
                  </label>
                  <p className="font-mono text-sm">{selectedItem.noRegister}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Tanggal
                  </label>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(selectedItem.tanggal)}
                  </p>
                </div>
              </div>

              {/* Reporter Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Nama Pelapor
                  </label>
                  <p className="text-sm flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {selectedItem.namaPelapor || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    NPP Pelapor
                  </label>
                  <p className="text-sm">{selectedItem.nppPelapor || "-"}</p>
                </div>
              </div>

              {/* Location Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Lokasi
                  </label>
                  <p className="text-sm flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedItem.lokasi || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Area Temuan
                  </label>
                  <p className="text-sm">{selectedItem.areaTemuan || "-"}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Keterangan
                </label>
                <p className="text-sm bg-muted/50 p-3 rounded-md">
                  {selectedItem.keterangan || "-"}
                </p>
              </div>

              {/* Status Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status Tindak Lanjut
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(selectedItem.statusTindakLanjut)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Update Status
                  </label>
                  <div className="mt-1">
                    {getUpdateStatusBadge(selectedItem.updateStatus, selectedItem.dueDate)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Due Date
                  </label>
                  <p className="text-sm">{formatDate(selectedItem.dueDate)}</p>
                </div>
              </div>

              {/* Additional Info */}
              {(selectedItem.kategori || selectedItem.sumberTemuan || selectedItem.kriteriaKtaTta) && (
                <div className="grid grid-cols-1 gap-4">
                  {selectedItem.kategori && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Kategori
                      </label>
                      <p className="text-sm">{selectedItem.kategori}</p>
                    </div>
                  )}
                  {selectedItem.sumberTemuan && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Sumber Temuan
                      </label>
                      <p className="text-sm">{selectedItem.sumberTemuan}</p>
                    </div>
                  )}
                  {selectedItem.kriteriaKtaTta && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Kriteria KTA/TTA
                      </label>
                      <p className="text-sm">{selectedItem.kriteriaKtaTta}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <span>Dibuat: {formatDate(selectedItem.createdAt)}</span>
                    {selectedItem.createdBy && (
                      <span className="block">oleh {selectedItem.createdBy.username}</span>
                    )}
                  </div>
                  <div>
                    <span>Diupdate: {formatDate(selectedItem.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}