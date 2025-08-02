"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/kta-tta";

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

interface TableViewProps {
  data: KtaTtaRecord[];
  onEdit: (record: KtaTtaRecord) => void;
  onDelete: (id: number) => void;
  allowedPIC: string[];
  userRole: string;
  isLoading: boolean;
  dataType: "KTA_TTA" | "KPI_UTAMA";
}

export function KtaTtaTableView({
  data,
  onEdit,
  onDelete,
  allowedPIC,
  userRole,
  isLoading,
  dataType,
}: TableViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPIC, setSelectedPIC] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedKategori, setSelectedKategori] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Get unique values for filters
  const uniquePIC = useMemo(() => {
    const pics = [
      ...new Set(data.map((item) => item.picDepartemen).filter(Boolean)),
    ] as string[];
    return allowedPIC.length > 0
      ? pics.filter((pic) => allowedPIC.includes(pic))
      : pics;
  }, [data, allowedPIC]);

  const uniqueStatus = useMemo(() => {
    return [
      ...new Set(data.map((item) => item.statusTindakLanjut).filter(Boolean)),
    ] as string[];
  }, [data]);

  const uniqueKategori = useMemo(() => {
    return [
      ...new Set(data.map((item) => item.kategori).filter(Boolean)),
    ] as string[];
  }, [data]);

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.noRegister.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nppPelapor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.namaPelapor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.keterangan?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPIC = !selectedPIC || item.picDepartemen === selectedPIC;
      const matchesStatus =
        !selectedStatus || item.statusTindakLanjut === selectedStatus;
      const matchesKategori =
        !selectedKategori || item.kategori === selectedKategori;

      return matchesSearch && matchesPIC && matchesStatus && matchesKategori;
    });
  }, [data, searchTerm, selectedPIC, selectedStatus, selectedKategori]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedPIC("");
    setSelectedStatus("");
    setSelectedKategori("");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Memuat data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {/* Header & Search */}
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <CardTitle>
            Data {dataType === "KTA_TTA" ? "KTA & TTA" : "KPI Utama"} (
            {filteredData.length} dari {data.length} records)
          </CardTitle>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari nomor registrasi, NPP, nama, atau keterangan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-80"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">PIC</label>
              <Select value={selectedPIC} onValueChange={setSelectedPIC}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua PIC" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua PIC</SelectItem>
                  {uniquePIC.map((pic) => (
                    <SelectItem key={pic} value={pic}>
                      {pic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Status
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Status</SelectItem>
                  {uniqueStatus.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Kategori
              </label>
              <Select
                value={selectedKategori}
                onValueChange={setSelectedKategori}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Kategori</SelectItem>
                  {uniqueKategori.map((kategori) => (
                    <SelectItem key={kategori} value={kategori}>
                      {kategori}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Reset Filter
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      {/* Table */}
      <CardContent>
        {filteredData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>Tidak ada data yang sesuai dengan filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    <div className="flex flex-col">
                      <span>No. Registrasi</span>
                      <span className="text-xs text-gray-500 font-normal">
                        (UPBE/YY/MM/XXX)
                      </span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    NPP
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Pelapor
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    PIC
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Kategori
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Update Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border">
                        {record.noRegister || "Auto Generated"}
                      </div>
                      {record.lokasi && (
                        <div className="text-xs text-gray-500 flex items-center mt-2">
                          <MapPin className="w-3 h-3 mr-1" />
                          {record.lokasi}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 font-mono">
                        {record.nppPelapor || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {record.namaPelapor || "-"}
                      </div>
                      {record.perusahaanBiro && (
                        <div className="text-xs text-gray-500">
                          {record.perusahaanBiro}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                        {formatDate(record.tanggal)}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant="outline">
                        {record.picDepartemen || "-"}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {record.kategori || "-"}
                      </div>
                      {record.kriteriaKtaTta && (
                        <div className="text-xs text-gray-500">
                          {record.kriteriaKtaTta}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          record.statusTindakLanjut === "CLOSE"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {record.statusTindakLanjut || "-"}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {formatDate(record.dueDate)}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          record.updateStatus === "Close"
                            ? "default"
                            : record.updateStatus === "Due Date"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {record.updateStatus || "Proses"}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(record)}
                          className="p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        {record.fotoUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="p-1"
                          >
                            <a
                              href={record.fotoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}

                        {userRole === "ADMIN" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(record.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {filteredData.length > 0 && (
          <div className="mt-4 text-sm text-gray-700">
            Menampilkan {filteredData.length} dari {data.length} total records
          </div>
        )}
      </CardContent>
    </Card>
  );
}
