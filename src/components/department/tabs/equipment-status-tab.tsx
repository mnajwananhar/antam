"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NotificationContainer } from "@/components/ui/notification";
import { useNotification, useApiNotification } from "@/lib/hooks";
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
  Save,
  Settings2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
} from "lucide-react";
import { dateUtils } from "@/lib/utils";
import { Department, EquipmentStatus } from "@prisma/client";
import { EquipmentWithStatus } from "@/types/equipment";

interface EquipmentStatusTabProps {
  equipment: EquipmentWithStatus[];
  department: Department;
}

export function EquipmentStatusTab({
  equipment,
  department,
}: EquipmentStatusTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [statusUpdates, setStatusUpdates] = useState<
    Record<number, { status: EquipmentStatus }>
  >({});

  // ✅ MENGGUNAKAN NOTIFICATION SYSTEM YANG REUSABLE
  const { notification, showError, clearNotification } = useNotification();
  const { executeUpdate } = useApiNotification();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EquipmentStatus>(
    "all"
  );
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Get unique categories from equipment
  const uniqueCategories = Array.from(
    new Set(equipment.map((eq) => eq.category.name))
  ).sort();

  // Apply filters to equipment
  const filteredEquipment = equipment.filter((eq) => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.category.name.toLowerCase().includes(searchTerm.toLowerCase());

    const currentStatus = statusUpdates[eq.id]?.status || eq.currentStatus;
    const matchesStatus =
      statusFilter === "all" || currentStatus === statusFilter;

    const matchesCategory =
      categoryFilter === "all" || eq.category.name === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleStatusChange = (equipmentId: number, status: EquipmentStatus) => {
    setStatusUpdates((prev) => ({
      ...prev,
      [equipmentId]: {
        status,
      },
    }));
  };

  const handleSaveChanges = async () => {
    if (Object.keys(statusUpdates).length === 0) {
      showError("Tidak ada perubahan untuk disimpan");
      return;
    }

    setIsLoading(true);
    clearNotification();

    try {
      const updates = Object.entries(statusUpdates).map(
        ([equipmentId, update]) => ({
          equipmentId: parseInt(equipmentId),
          status: update.status,
        })
      );

      // ✅ IMMEDIATE NOTIFICATION - Langsung muncul setelah API call
      const result = await executeUpdate(
        () =>
          fetch("/api/equipment/bulk-update", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ updates }),
          }),
        "status equipment"
      );

      // ✅ SUCCESS ACTIONS - Reset state jika berhasil
      if (result.success) {
        setStatusUpdates({});
        // Tambahan sukses feedback manual jika diperlukan
        setTimeout(() => {
          router.refresh();
        }, 1000); // Delay refresh agar user sempat lihat notifikasi
      }
    } catch (error) {
      console.error("Error saving equipment status:", error);
      showError("Terjadi kesalahan sistem yang tidak terduga");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (
    status: EquipmentStatus
  ): "success" | "warning" | "destructive" | "secondary" => {
    const colors = {
      WORKING: "success" as const,
      STANDBY: "warning" as const, // Keep for backward compatibility
      BREAKDOWN: "destructive" as const,
    };
    return colors[status] || "secondary";
  };

  const getPendingChangesCount = () => {
    return Object.keys(statusUpdates).length;
  };

  return (
    <div className="space-y-6">
      {/* ✅ NOTIFICATION CONTAINER - Positioned for optimal visibility */}
      <NotificationContainer
        notification={notification}
        onClose={clearNotification}
      />

      {/* Equipment Stats - Hanya untuk Status Alat */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Peralatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipment.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Working</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {equipment.filter((eq) => eq.currentStatus === "WORKING").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {
                equipment.filter((eq) => eq.currentStatus === "BREAKDOWN")
                  .length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Status Peralatan - {department.name}
          </CardTitle>
          <CardDescription>
            Fitur ini hanya untuk mengubah status peralatan (Working/Breakdown)
            secara real-time. Keterangan detail akan tersedia di fitur Aktivitas
            Harian.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end">
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {getPendingChangesCount() > 0 && (
                <Badge variant="outline" className="text-orange-600">
                  {getPendingChangesCount()} perubahan pending
                </Badge>
              )}
              <Button
                onClick={handleSaveChanges}
                disabled={isLoading || getPendingChangesCount() === 0}
                loading={isLoading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-4 w-4" />
            Filter Peralatan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Cari berdasarkan nama atau kode peralatan... (Ctrl+K)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as "all" | EquipmentStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="WORKING">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Working
                    </div>
                  </SelectItem>
                  <SelectItem value="BREAKDOWN">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-3 w-3 text-red-600" />
                      Breakdown
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="w-full sm:w-48">
              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(searchTerm ||
              statusFilter !== "all" ||
              categoryFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                }}
                className="w-full sm:w-auto"
              >
                Reset Filter
              </Button>
            )}
          </div>

          {/* Filter Results Info */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Menampilkan</span>
              <Badge variant="outline">{filteredEquipment.length}</Badge>
              <span>dari</span>
              <Badge variant="outline">{equipment.length}</Badge>
              <span>peralatan</span>
            </div>

            {/* Active Filters */}
            <div className="flex items-center gap-2">
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  <Search className="h-3 w-3" />
                  &quot;{searchTerm}&quot;
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {statusFilter === "WORKING" ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {statusFilter}
                </Badge>
              )}
              {categoryFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  <Filter className="h-3 w-3" />
                  {categoryFilter}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Nama Peralatan</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Status Saat Ini</TableHead>
                  <TableHead>Ubah Status</TableHead>
                  <TableHead>Last Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {equipment.length === 0 ? (
                        <div className="flex flex-col items-center gap-2">
                          <Settings2 className="h-8 w-8 text-muted-foreground/50" />
                          <p>Tidak ada peralatan yang tersedia</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Filter className="h-8 w-8 text-muted-foreground/50" />
                          <p>Tidak ada peralatan yang cocok dengan filter</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearchTerm("");
                              setStatusFilter("all");
                              setCategoryFilter("all");
                            }}
                            className="mt-2"
                          >
                            Reset Filter
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEquipment.map((eq) => {
                    const currentUpdate = statusUpdates[eq.id];
                    const displayStatus =
                      currentUpdate?.status || eq.currentStatus;

                    return (
                      <TableRow key={eq.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {eq.category.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{eq.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {eq.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(eq.currentStatus)}>
                            {eq.currentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant={
                                displayStatus === "WORKING"
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                handleStatusChange(eq.id, "WORKING")
                              }
                              className={`flex items-center gap-1 transition-all duration-200 ${
                                displayStatus === "WORKING"
                                  ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                                  : "text-green-600 border-green-600 hover:bg-green-50 hover:border-green-700"
                              }`}
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span className="text-xs font-medium">
                                Working
                              </span>
                            </Button>
                            <Button
                              variant={
                                displayStatus === "BREAKDOWN"
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                handleStatusChange(eq.id, "BREAKDOWN")
                              }
                              className={`flex items-center gap-1 transition-all duration-200 ${
                                displayStatus === "BREAKDOWN"
                                  ? "bg-red-600 hover:bg-red-700 text-white shadow-md"
                                  : "text-red-600 border-red-600 hover:bg-red-50 hover:border-red-700"
                              }`}
                            >
                              <XCircle className="h-3 w-3" />
                              <span className="text-xs font-medium">
                                Breakdown
                              </span>
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {dateUtils.formatDateTime(eq.lastStatusChange)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
