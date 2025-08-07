"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Building,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

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

interface KtaKpiTableProps {
  data: KtaKpiItem[];
  isLoading?: boolean;
  dataType: "KTA_TTA" | "KPI_UTAMA";
  onEdit?: (item: KtaKpiItem) => void;
  onDelete?: (id: number) => void;
  onView?: (item: KtaKpiItem) => void;
  showActions?: boolean;
  maxHeight?: string;
}

export function KtaKpiTable({
  data,
  isLoading = false,
  dataType,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  maxHeight = "500px",
}: KtaKpiTableProps) {
  const [selectedItem, setSelectedItem] = useState<KtaKpiItem | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "-";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return format(dateObj, "dd MMM yyyy", { locale: id });
    } catch {
      return "-";
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "CLOSE":
        return "default";
      case "OPEN":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case "CLOSE":
        return <CheckCircle className="h-4 w-4" />;
      case "OPEN":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleView = (item: KtaKpiItem) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
    onView?.(item);
  };

  const handleEdit = (item: KtaKpiItem) => {
    onEdit?.(item);
  };

  const handleDelete = (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      onDelete?.(id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Memuat data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Data</h3>
            <p className="text-muted-foreground">
              Belum ada data {dataType === "KTA_TTA" ? "KTA & TTA" : "KPI Utama"} yang tersedia.
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
          <CardTitle>
            Data {dataType === "KTA_TTA" ? "KTA & TTA" : "KPI Utama"} ({data.length})
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
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead className="w-32">No. Register</TableHead>
                    <TableHead className="w-36">Nama Pelapor</TableHead>
                    <TableHead className="w-28">Tanggal</TableHead>
                    <TableHead className="w-40">Lokasi</TableHead>
                    <TableHead className="w-36">Area Temuan</TableHead>
                    <TableHead className="w-48">Keterangan</TableHead>
                    <TableHead className="w-36">Sumber Temuan</TableHead>
                    <TableHead className="w-32">PIC Departemen</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-28">Due Date</TableHead>
                    <TableHead className="w-32">Dibuat Oleh</TableHead>
                    <TableHead className="w-32">Tanggal Dibuat</TableHead>
                    {showActions && (
                      <TableHead className="w-32 text-center">Aksi</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.noRegister || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-32" title={item.namaPelapor}>
                            {item.namaPelapor || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(item.tanggal)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-32" title={item.lokasi}>
                            {item.lokasi || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-32" title={item.areaTemuan}>
                            {item.areaTemuan || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-48">
                          <p className="truncate" title={item.keterangan}>
                            {item.keterangan || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-32" title={item.sumberTemuan}>
                            {item.sumberTemuan || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-28" title={item.picDepartemen}>
                            {item.picDepartemen || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusColor(item.statusTindakLanjut)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(item.statusTindakLanjut)}
                          {item.statusTindakLanjut || "OPEN"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDate(item.dueDate)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {item.createdBy.username}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </span>
                      </TableCell>
                      {showActions && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleView(item)}
                              className="h-7 w-7 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {onEdit && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(item)}
                                className="h-7 w-7 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(item.id)}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
            </TableBody>
            </Table>
          </div>

          {/* Summary Footer */}
          <div className="p-4 border-t bg-muted/30">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {data.filter((item) => item.statusTindakLanjut === "CLOSE").length} selesai
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-orange-600" />
                  {data.filter((item) => item.statusTindakLanjut === "OPEN").length} terbuka
                </span>
              </div>
              <span className="text-muted-foreground">
                Total: {data.length} item
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Detail Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detail {dataType === "KTA_TTA" ? "KTA & TTA" : "KPI Utama"}
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.noRegister}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      No. Register
                    </label>
                    <p className="text-sm font-medium">{selectedItem.noRegister}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Tanggal
                    </label>
                    <p className="text-sm">{formatDate(selectedItem.tanggal)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Lokasi
                    </label>
                    <p className="text-sm">{selectedItem.lokasi || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Area Temuan
                    </label>
                    <p className="text-sm">{selectedItem.areaTemuan || "-"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      PIC Departemen
                    </label>
                    <p className="text-sm">{selectedItem.picDepartemen || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Status Tindak Lanjut
                    </label>
                    <div className="mt-1">
                      <Badge
                        variant={getStatusColor(selectedItem.statusTindakLanjut)}
                        className="flex items-center gap-1 w-fit"
                      >
                        {getStatusIcon(selectedItem.statusTindakLanjut)}
                        {selectedItem.statusTindakLanjut || "OPEN"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Due Date
                    </label>
                    <p className="text-sm">{formatDate(selectedItem.dueDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Kategori
                    </label>
                    <p className="text-sm">{selectedItem.kategori || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Keterangan
                </label>
                <div className="mt-1 p-3 bg-muted/30 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedItem.keterangan || "-"}
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      NPP Pelapor
                    </label>
                    <p className="text-sm">{selectedItem.nppPelapor || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Nama Pelapor
                    </label>
                    <p className="text-sm">{selectedItem.namaPelapor || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Perusahaan/Biro
                    </label>
                    <p className="text-sm">{selectedItem.perusahaanBiro || "-"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Sumber Temuan
                    </label>
                    <p className="text-sm">{selectedItem.sumberTemuan || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Kriteria {dataType === "KTA_TTA" ? "KTA/TTA" : "KPI"}
                    </label>
                    <p className="text-sm">{selectedItem.kriteriaKtaTta || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Perusahaan Pengelola
                    </label>
                    <p className="text-sm">{selectedItem.perusahaanPengelola || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Follow Up */}
              {selectedItem.tindakLanjutLangsung && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Tindak Lanjut Langsung
                  </label>
                  <div className="mt-1 p-3 bg-muted/30 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedItem.tindakLanjutLangsung}
                    </p>
                  </div>
                </div>
              )}

              {/* Meta Info */}
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Dibuat oleh:</span> {selectedItem.createdBy.username}
                  </div>
                  <div>
                    <span className="font-medium">Tanggal dibuat:</span> {formatDate(selectedItem.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}