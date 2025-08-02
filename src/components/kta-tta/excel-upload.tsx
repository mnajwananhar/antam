"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Check,
  Trash2,
  AlertCircle,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import * as XLSX from "xlsx";

interface ExcelRow {
  id?: number;
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
  [key: string]: string | number | undefined;
}

interface ExcelUploadProps {
  onUpload: (data: ExcelRow[]) => Promise<void>;
  allowedPIC: string[];
  dataType: "KTA_TTA" | "KPI_UTAMA";
  isUploading?: boolean;
}

interface EditingCell {
  rowIndex: number;
  field: string;
  value: string;
}

const REQUIRED_COLUMNS = [
  "noRegister",
  "nppPelapor",
  "namaPelapor",
  "picDepartemen",
];

const COLUMNS = [
  { key: "noRegister", label: "No. Registrasi", required: true, type: "text" },
  { key: "nppPelapor", label: "NPP Pelapor", required: true, type: "text" },
  { key: "namaPelapor", label: "Nama Pelapor", required: true, type: "text" },
  { key: "perusahaanBiro", label: "Perusahaan/Biro", type: "text" },
  { key: "tanggal", label: "Tanggal", type: "date" },
  { key: "lokasi", label: "Lokasi", type: "text" },
  { key: "areaTemuan", label: "Area Temuan", type: "text" },
  {
    key: "kategori",
    label: "Kategori",
    type: "select",
    options: ["Kondisi Tidak Aman", "Tindakan Tidak Aman"],
  },
  { key: "picDepartemen", label: "PIC", required: true, type: "picSelect" },
  {
    key: "kriteriaKtaTta",
    label: "Kriteria KTA/TTA",
    type: "select",
    options: [
      "Peralatan Bergerak",
      "Pengelolaan Jalan dan Lalu lintas",
      "Isolasi Energi",
      "Pengelolaan Ban",
      "Bekerja di dekat/atas air",
      "Bejana bertekanan",
      "Pelindung mesin / Mesin berat",
      "Bahan kimia berbahaya dan beracun",
      "House Keeping & Tata Lingkungan",
      "Lain-lain",
    ],
  },
  { key: "sumberTemuan", label: "Sumber Temuan", type: "text" },
  {
    key: "statusTindakLanjut",
    label: "Status",
    type: "select",
    options: ["OPEN", "CLOSE"],
  },
  { key: "tindakLanjutLangsung", label: "Tindak Lanjut", type: "textarea" },
  { key: "dueDate", label: "Due Date", type: "date" },
  {
    key: "updateStatus",
    label: "Update Status",
    type: "select",
    options: ["Proses", "Due Date", "Close"],
  },
  { key: "keterangan", label: "Keterangan", type: "textarea" },
  { key: "fotoUrl", label: "Foto URL", type: "text" },
];

const COLUMN_MAPPING: Record<string, string> = {
  "npp pelapor": "nppPelapor",
  npp: "nppPelapor",
  "nomor pelapor": "nppPelapor",
  "nama pelapor": "namaPelapor",
  perusahaan: "perusahaanBiro",
  biro: "perusahaanBiro",
  tanggal: "tanggal",
  lokasi: "lokasi",
  area: "areaTemuan",
  "area temuan": "areaTemuan",
  kategori: "kategori",
  pic: "picDepartemen",
  kriteria: "kriteriaKtaTta",
  sumber: "sumberTemuan",
  status: "statusTindakLanjut",
  "tindak lanjut": "tindakLanjutLangsung",
  "due date": "dueDate",
  update: "updateStatus",
  keterangan: "keterangan",
  foto: "fotoUrl",
};

export function ExcelUpload({
  onUpload,
  allowedPIC,
  isUploading = false,
}: ExcelUploadProps) {
  const [uploadedData, setUploadedData] = useState<ExcelRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [errors, setErrors] = useState<Record<number, string[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeColumnName = (columnName: string): string => {
    const normalized = columnName.toLowerCase().trim();
    return COLUMN_MAPPING[normalized] || columnName;
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrors({});

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error(
          "File Excel harus memiliki header dan minimal 1 baris data"
        );
      }

      // Extract headers and normalize them
      const headers = (jsonData[0] as string[]).map(normalizeColumnName);
      const dataRows = jsonData.slice(1) as string[][];

      // Convert to objects
      const processedData: ExcelRow[] = dataRows
        .filter((row) =>
          row.some((cell) => cell && cell.toString().trim() !== "")
        )
        .map((row, index) => {
          const rowData: ExcelRow = { id: index + 1 };

          headers.forEach((header, colIndex) => {
            const value = row[colIndex];
            if (value !== undefined && value !== null) {
              const strValue = value.toString().trim();
              if (strValue !== "") {
                // Handle date conversion
                if (header === "tanggal" || header === "dueDate") {
                  // Try to parse Excel date
                  if (typeof value === "number") {
                    const excelDate = XLSX.SSF.parse_date_code(value);
                    const jsDate = new Date(
                      excelDate.y,
                      excelDate.m - 1,
                      excelDate.d
                    );
                    (rowData as Record<string, string | number>)[header] =
                      jsDate.toISOString().split("T")[0];
                  } else {
                    (rowData as Record<string, string | number>)[header] =
                      strValue;
                  }
                } else {
                  (rowData as Record<string, string | number>)[header] =
                    strValue;
                }
              }
            }
          });

          return rowData;
        });

      setUploadedData(processedData);
      validateData(processedData);
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      alert(
        "Error membaca file Excel: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const validateData = (data: ExcelRow[]) => {
    const newErrors: Record<number, string[]> = {};

    data.forEach((row, index) => {
      const rowErrors: string[] = [];

      // Check required fields
      REQUIRED_COLUMNS.forEach((field) => {
        if (
          !row[field as keyof ExcelRow] ||
          row[field as keyof ExcelRow]?.toString().trim() === ""
        ) {
          rowErrors.push(`${field} wajib diisi`);
        }
      });

      // Check PIC access
      if (
        row.picDepartemen &&
        allowedPIC.length > 0 &&
        !allowedPIC.includes(row.picDepartemen)
      ) {
        rowErrors.push(`Tidak memiliki akses untuk PIC: ${row.picDepartemen}`);
      }

      if (rowErrors.length > 0) {
        newErrors[index] = rowErrors;
      }
    });

    setErrors(newErrors);
  };

  const handleCellEdit = (rowIndex: number, field: string, value: string) => {
    const updatedData = [...uploadedData];
    (updatedData[rowIndex] as Record<string, string | number>)[field] = value;
    setUploadedData(updatedData);
    setEditingCell(null);

    // Re-validate after edit
    validateData(updatedData);
  };

  const handleDeleteRow = (rowIndex: number) => {
    const newData = uploadedData.filter((_, index) => index !== rowIndex);
    setUploadedData(newData.map((row, index) => ({ ...row, id: index + 1 })));

    // Update errors
    const newErrors: Record<number, string[]> = {};
    Object.entries(errors).forEach(([key, value]) => {
      const oldIndex = parseInt(key);
      if (oldIndex < rowIndex) {
        newErrors[oldIndex] = value;
      } else if (oldIndex > rowIndex) {
        newErrors[oldIndex - 1] = value;
      }
    });
    setErrors(newErrors);
  };

  const handleAddRow = () => {
    const newRow: ExcelRow = {
      id: uploadedData.length + 1,
      namaPelapor: "",
      picDepartemen: allowedPIC[0] || "",
      sumberTemuan: "Inspeksi",
      statusTindakLanjut: "OPEN",
      updateStatus: "Proses",
    };
    setUploadedData([...uploadedData, newRow]);
  };

  const handleSubmitData = async () => {
    if (uploadedData.length === 0) return;

    // Check if there are any errors
    if (Object.keys(errors).length > 0) {
      alert(
        "Masih ada data yang tidak valid. Silakan perbaiki terlebih dahulu."
      );
      return;
    }

    try {
      await onUpload(uploadedData);
      setUploadedData([]);
      setErrors({});
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading data:", error);
    }
  };

  const renderCell = (
    row: ExcelRow,
    column: (typeof COLUMNS)[0],
    rowIndex: number
  ) => {
    const value = (row as Record<string, string | number>)[column.key] || "";
    const isEditing =
      editingCell?.rowIndex === rowIndex && editingCell?.field === column.key;

    if (isEditing) {
      if (column.type === "select") {
        return (
          <Select
            value={editingCell.value}
            onValueChange={(newValue) => {
              setEditingCell({ ...editingCell, value: newValue });
            }}
            onOpenChange={(open) => {
              if (!open) {
                handleCellEdit(rowIndex, column.key, editingCell.value);
              }
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {column.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      } else if (column.type === "picSelect") {
        return (
          <Select
            value={editingCell.value}
            onValueChange={(newValue) => {
              setEditingCell({ ...editingCell, value: newValue });
            }}
            onOpenChange={(open) => {
              if (!open) {
                handleCellEdit(rowIndex, column.key, editingCell.value);
              }
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowedPIC.map((pic) => (
                <SelectItem key={pic} value={pic}>
                  {pic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      } else if (column.type === "textarea") {
        return (
          <Textarea
            value={editingCell.value}
            onChange={(e) =>
              setEditingCell({ ...editingCell, value: e.target.value })
            }
            onBlur={() =>
              handleCellEdit(rowIndex, column.key, editingCell.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCellEdit(rowIndex, column.key, editingCell.value);
              }
              if (e.key === "Escape") {
                setEditingCell(null);
              }
            }}
            className="h-8 text-xs"
            rows={2}
          />
        );
      } else {
        return (
          <Input
            type={column.type === "date" ? "date" : "text"}
            value={editingCell.value}
            onChange={(e) =>
              setEditingCell({ ...editingCell, value: e.target.value })
            }
            onBlur={() =>
              handleCellEdit(rowIndex, column.key, editingCell.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCellEdit(rowIndex, column.key, editingCell.value);
              }
              if (e.key === "Escape") {
                setEditingCell(null);
              }
            }}
            className="h-8 text-xs"
          />
        );
      }
    }

    return (
      <div
        className="px-2 py-1 min-h-[2rem] cursor-pointer hover:bg-gray-100 flex items-center"
        onClick={() =>
          setEditingCell({
            rowIndex,
            field: column.key,
            value: value.toString(),
          })
        }
      >
        <span className="text-xs truncate">{value || "-"}</span>
        <Edit className="w-3 h-3 ml-1 opacity-50" />
      </div>
    );
  };

  const hasErrors = Object.keys(errors).length > 0;
  const hasValidData = uploadedData.length > 0 && !hasErrors;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Pilih file Excel (.xlsx, .xls) untuk diupload
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Pastikan file memiliki header yang sesuai dengan template.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{isProcessing ? "Memproses..." : "Pilih File"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Errors Alert */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Ditemukan {Object.keys(errors).length} baris dengan error. Silakan
            perbaiki sebelum menyimpan data.
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Data */}
      {uploadedData.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Data ({uploadedData.length} baris)
                </span>
                {hasValidData && (
                  <Badge variant="default" className="bg-green-500">
                    Valid
                  </Badge>
                )}
                {hasErrors && (
                  <Badge variant="destructive">
                    {Object.keys(errors).length} Error
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={handleAddRow}
                  className="flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Tambah Baris</span>
                </Button>
                <Button
                  onClick={handleSubmitData}
                  disabled={
                    isUploading || hasErrors || uploadedData.length === 0
                  }
                  className="flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{isUploading ? "Mengupload..." : "Simpan Semua"}</span>
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-900 border">
                      #
                    </th>
                    {COLUMNS.map((column) => (
                      <th
                        key={column.key}
                        className="px-2 py-3 text-left text-xs font-medium text-gray-900 border min-w-[120px]"
                      >
                        {column.label}
                        {column.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </th>
                    ))}
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-900 border">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {uploadedData.map((row, rowIndex) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-gray-50 ${
                        errors[rowIndex] ? "bg-red-50" : ""
                      }`}
                    >
                      <td className="px-2 py-1 text-xs text-gray-900 border">
                        <div className="flex flex-col items-center">
                          <span>{rowIndex + 1}</span>
                          {errors[rowIndex] && (
                            <Badge
                              variant="destructive"
                              className="text-xs mt-1"
                            >
                              Error
                            </Badge>
                          )}
                        </div>
                      </td>
                      {COLUMNS.map((column) => (
                        <td key={column.key} className="border">
                          {renderCell(row, column, rowIndex)}
                        </td>
                      ))}
                      <td className="px-2 py-1 border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRow(rowIndex)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Error Details */}
            {hasErrors && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-red-600">Detail Error:</h4>
                {Object.entries(errors).map(([rowIndex, rowErrors]) => (
                  <div key={rowIndex} className="text-sm text-red-600">
                    <strong>Baris {parseInt(rowIndex) + 1}:</strong>{" "}
                    {rowErrors.join(", ")}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
