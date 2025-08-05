"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToastContext } from "@/lib/hooks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileSpreadsheet,
  Download,
  Trash2,
  Plus,
  Edit,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";

export interface ExcelRowData {
  id: string;
  no?: string;
  noRegister?: string;
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
  [key: string]: string | undefined;
}

interface ExcelUploadProps {
  onDataChange: (data: ExcelRowData[]) => void;
  dataType: "KTA_TTA" | "KPI_UTAMA";
  availableDepartments?: Array<{ id: number; name: string; code: string }>;
  disabled?: boolean;
}

const COLUMN_HEADERS = {
  no: "No.",
  noRegister: "No Register",
  nppPelapor: "NPP Pelapor/ Nomor Pegawai",
  namaPelapor: "Nama Pelapor",
  perusahaanBiro: "Perusahaan/ Biro",
  tanggal: "Tanggal",
  lokasi: "Lokasi",
  areaTemuan: "Area Temuan",
  keterangan: "Keterangan",
  fotoUrl: "Foto",
  kategori: "Kategori",
  sumberTemuan: "Sumber Temuan",
  picDepartemen: "PIC",
  kriteriaKtaTta: "Kriteria KTA/TTA",
  perusahaanPengelola: "Perusahaan Pengelola",
  tindakLanjutLangsung: "Tindak Lanjut Secara Langsung",
  statusTindakLanjut: "Status Tindak Lanjut",
  biro: "Biro",
  dueDate: "Due Date",
  updateStatus: "Update Status",
};

const REQUIRED_COLUMNS = [
  "nppPelapor",
  "namaPelapor",
  "tanggal",
  "lokasi",
  "keterangan",
  "picDepartemen",
];

export function ExcelUpload({
  onDataChange,
  dataType,
  disabled = false,
}: ExcelUploadProps) {
  const [data, setData] = useState<ExcelRowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    column: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");

  const { showSuccess, showError, showInfo } = useToastContext();

  // Generate unique ID for new rows
  const generateId = () =>
    `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Handle file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert to JSON with header mapping
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
          }) as string[][];

          if (jsonData.length < 2) {
            throw new Error(
              "File Excel harus memiliki minimal header dan satu baris data"
            );
          }

          // Map headers to our column keys
          const headers = jsonData[0] as string[];
          console.log("Excel headers found:", headers);
          const mappedData: ExcelRowData[] = [];

          // Create header mapping for exact Excel headers
          const headerMapping: { [key: string]: string } = {
            "No.": "no",
            "No Register": "noRegister",
            "NPP Pelapor/ Nomor Pegawai": "nppPelapor",
            "Nama Pelapor": "namaPelapor",
            "Perusahaan/ Biro": "perusahaanBiro",
            Tanggal: "tanggal",
            Lokasi: "lokasi",
            "Area Temuan": "areaTemuan",
            Keterangan: "keterangan",
            Foto: "fotoUrl",
            Kategori: "kategori",
            "Sumber Temuan": "sumberTemuan",
            PIC: "picDepartemen",
            "Kriteria KTA/TTA": "kriteriaKtaTta",
            "Perusahaan Pengelola": "perusahaanPengelola",
            "Tindak Lanjut Secara Langsung": "tindakLanjutLangsung",
            "Status Tindak Lanjut": "statusTindakLanjut",
            Biro: "biro",
            "Due Date": "dueDate",
            "Update Status": "updateStatus",
          };

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row.every((cell) => !cell || cell.toString().trim() === "")) {
              continue; // Skip empty rows
            }

            const mappedRow: ExcelRowData = {
              id: generateId(),
            };

            headers.forEach((header, index) => {
              if (header && row[index] !== undefined) {
                // Use exact header mapping first
                let key = headerMapping[header.trim()];

                // If no exact match, try fuzzy matching
                if (!key) {
                  const normalizedHeader = header.toLowerCase().trim();
                  if (normalizedHeader.includes("register")) key = "noRegister";
                  else if (
                    normalizedHeader.includes("npp") ||
                    normalizedHeader.includes("nomor pegawai")
                  )
                    key = "nppPelapor";
                  else if (normalizedHeader.includes("nama pelapor"))
                    key = "namaPelapor";
                  else if (
                    normalizedHeader.includes("perusahaan") &&
                    normalizedHeader.includes("biro")
                  )
                    key = "perusahaanBiro";
                  else if (normalizedHeader.includes("tanggal"))
                    key = "tanggal";
                  else if (normalizedHeader.includes("lokasi")) key = "lokasi";
                  else if (normalizedHeader.includes("area temuan"))
                    key = "areaTemuan";
                  else if (normalizedHeader.includes("keterangan"))
                    key = "keterangan";
                  else if (normalizedHeader.includes("foto")) key = "fotoUrl";
                  else if (normalizedHeader.includes("kategori"))
                    key = "kategori";
                  else if (normalizedHeader.includes("sumber temuan"))
                    key = "sumberTemuan";
                  else if (
                    normalizedHeader.includes("pic") &&
                    !normalizedHeader.includes("kriteria")
                  )
                    key = "picDepartemen";
                  else if (normalizedHeader.includes("kriteria"))
                    key = "kriteriaKtaTta";
                  else if (normalizedHeader.includes("perusahaan pengelola"))
                    key = "perusahaanPengelola";
                  else if (normalizedHeader.includes("tindak lanjut"))
                    key = "tindakLanjutLangsung";
                  else if (normalizedHeader.includes("status"))
                    key = "statusTindakLanjut";
                  else if (normalizedHeader.includes("biro")) key = "biro";
                  else if (normalizedHeader.includes("due date"))
                    key = "dueDate";
                  else if (normalizedHeader.includes("update status"))
                    key = "updateStatus";
                }

                if (key && row[index] !== undefined && row[index] !== null) {
                  const cellValue = row[index].toString().trim();

                  // Handle date fields
                  if (key === "tanggal" || key === "dueDate") {
                    if (cellValue) {
                      try {
                        // Handle Excel date serial numbers
                        let date: Date;
                        if (
                          !isNaN(Number(cellValue)) &&
                          Number(cellValue) > 40000
                        ) {
                          // Excel serial date (starts from 1900-01-01)
                          date = new Date(
                            (Number(cellValue) - 25569) * 86400 * 1000
                          );
                        } else {
                          // Regular date string
                          date = new Date(cellValue);
                        }

                        if (!isNaN(date.getTime())) {
                          mappedRow[key] = date.toISOString().split("T")[0];
                        } else {
                          mappedRow[key] = cellValue;
                        }
                      } catch {
                        mappedRow[key] = cellValue;
                      }
                    }
                  } else {
                    mappedRow[key] = cellValue;
                  }
                }
              }
            });

            mappedData.push(mappedRow);
          }

          console.log("Mapped data sample:", mappedData.slice(0, 2));

          if (mappedData.length === 0) {
            throw new Error("Tidak ada data valid yang ditemukan dalam file");
          }

          setData(mappedData);
          onDataChange(mappedData);
          setSuccess(
            `Berhasil memuat ${mappedData.length} baris data dari Excel`
          );
          showSuccess(
            `Berhasil memuat ${mappedData.length} baris data dari Excel`
          );
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Gagal membaca file Excel";
          setError(errorMessage);
          showError(errorMessage);
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        const errorMsg = "Gagal membaca file";
        setError(errorMsg);
        showError(errorMsg);
        setIsLoading(false);
      };

      reader.readAsArrayBuffer(file);
    },
    [onDataChange, showError, showSuccess]
  );

  // Handle cell editing
  const handleCellEdit = (
    rowId: string,
    column: string,
    currentValue: string
  ) => {
    setEditingCell({ rowId, column });
    setEditValue(currentValue);
  };

  const handleCellSave = () => {
    if (!editingCell) return;

    const updatedData = data.map((row) => {
      if (row.id === editingCell.rowId) {
        return { ...row, [editingCell.column]: editValue };
      }
      return row;
    });

    setData(updatedData);
    onDataChange(updatedData);
    setEditingCell(null);
    setEditValue("");
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  // Add new row
  const addNewRow = () => {
    const newRow: ExcelRowData = {
      id: generateId(),
      noRegister: "",
      nppPelapor: "",
      namaPelapor: "",
      tanggal: new Date().toISOString().split("T")[0],
      lokasi: "",
      keterangan: "",
      picDepartemen: "",
    };

    const updatedData = [...data, newRow];
    setData(updatedData);
    onDataChange(updatedData);
    showInfo("Baris baru ditambahkan");
  };

  // Delete row
  const deleteRow = (rowId: string) => {
    const updatedData = data.filter((row) => row.id !== rowId);
    setData(updatedData);
    onDataChange(updatedData);
  };

  // Clear all data
  const clearData = () => {
    setData([]);
    onDataChange([]);
    setError(null);
    setSuccess(null);
    showInfo("Semua data dihapus");
  };

  // Download template
  const downloadTemplate = () => {
    const headers = Object.values(COLUMN_HEADERS);
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `template_${dataType.toLowerCase()}.xlsx`);
    showSuccess(`Template ${dataType} berhasil didownload`);
  };

  // Validate required fields
  const validateRow = (row: ExcelRowData) => {
    const errors: string[] = [];
    REQUIRED_COLUMNS.forEach((column) => {
      if (!row[column] || row[column].toString().trim() === "") {
        errors.push(COLUMN_HEADERS[column as keyof typeof COLUMN_HEADERS]);
      }
    });
    return errors;
  };

  // Get validation status for row
  const getRowValidation = (row: ExcelRowData) => {
    const errors = validateRow(row);
    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload Excel {dataType === "KTA_TTA" ? "KTA & TTA" : "KPI Utama"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Upload Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-0">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={disabled || isLoading}
                className="cursor-pointer"
              />
            </div>

            <Button
              variant="outline"
              onClick={downloadTemplate}
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Template
            </Button>

            {data.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={addNewRow}
                  disabled={disabled}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Baris
                </Button>

                <Button
                  variant="destructive"
                  onClick={clearData}
                  disabled={disabled}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus Semua
                </Button>
              </>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Memproses file Excel...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Table */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Preview Data ({data.length} baris)</span>
              <Badge
                variant={
                  data.every((row) => getRowValidation(row).isValid)
                    ? "default"
                    : "destructive"
                }
              >
                {data.filter((row) => getRowValidation(row).isValid).length}{" "}
                valid / {data.length} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Fixed Width Table Container with Horizontal Scroll */}
            <div className="border bg-background max-h-96 overflow-auto w-full max-w-[calc(100vw-32px)] md:max-w-[calc(100vw-320px)]">
              <Table className="w-max min-w-full">
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead className="w-16 text-center">Status</TableHead>
                    {Object.entries(COLUMN_HEADERS).map(([key, label]) => (
                      <TableHead
                        key={key}
                        className={`${
                          key === "noRegister"
                            ? "w-32"
                            : key === "keterangan"
                            ? "w-48"
                            : key === "tanggal" || key === "dueDate"
                            ? "w-28"
                            : "w-32"
                        }`}
                      >
                        {label}
                        {REQUIRED_COLUMNS.includes(key) && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </TableHead>
                    ))}
                    <TableHead className="w-24 text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => {
                    const validation = getRowValidation(row);
                    return (
                      <TableRow
                        key={row.id}
                        className={
                          !validation.isValid ? "bg-destructive/5" : ""
                        }
                      >
                        <TableCell className="text-center font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell className="text-center">
                          {validation.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <div
                              title={`Error: ${validation.errors.join(", ")}`}
                            >
                              <AlertCircle className="h-4 w-4 text-destructive mx-auto" />
                            </div>
                          )}
                        </TableCell>
                        {Object.keys(COLUMN_HEADERS).map((column) => (
                          <TableCell
                            key={column}
                            className={`${
                              column === "noRegister"
                                ? "w-32"
                                : column === "keterangan"
                                ? "w-48"
                                : column === "tanggal" || column === "dueDate"
                                ? "w-28"
                                : "w-32"
                            }`}
                          >
                            {editingCell?.rowId === row.id &&
                            editingCell?.column === column ? (
                              <div className="flex items-center gap-1">
                                {column.includes("tanggal") ||
                                column.includes("date") ? (
                                  <Input
                                    type="date"
                                    value={editValue}
                                    onChange={(e) =>
                                      setEditValue(e.target.value)
                                    }
                                    className="h-8 text-xs"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleCellSave();
                                      if (e.key === "Escape")
                                        handleCellCancel();
                                    }}
                                  />
                                ) : (
                                  <Input
                                    value={editValue}
                                    onChange={(e) =>
                                      setEditValue(e.target.value)
                                    }
                                    className="h-8 text-xs"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleCellSave();
                                      if (e.key === "Escape")
                                        handleCellCancel();
                                    }}
                                  />
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCellSave}
                                  className="h-6 w-6 p-0"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCellCancel}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-muted/50 p-1 rounded group min-h-6 flex items-center"
                                onClick={() =>
                                  !disabled &&
                                  handleCellEdit(
                                    row.id,
                                    column,
                                    row[column]?.toString() || ""
                                  )
                                }
                              >
                                <span className="truncate max-w-40">
                                  {row[column] || (
                                    <span className="text-muted-foreground italic">
                                      Kosong
                                    </span>
                                  )}
                                </span>
                                {!disabled && (
                                  <Edit className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </div>
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteRow(row.id)}
                            disabled={disabled}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Validation Summary */}
            <div className="p-4 border-t bg-muted/30">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {
                      data.filter((row) => getRowValidation(row).isValid).length
                    }{" "}
                    valid
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    {
                      data.filter((row) => !getRowValidation(row).isValid)
                        .length
                    }{" "}
                    error
                  </span>
                </div>
                <span className="text-muted-foreground">
                  Field wajib:{" "}
                  {REQUIRED_COLUMNS.map(
                    (col) => COLUMN_HEADERS[col as keyof typeof COLUMN_HEADERS]
                  ).join(", ")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
