"use client";

import { useState, useEffect, useCallback } from "react";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppLayout } from "@/components/layout/app-layout";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Plus,
  Search,
  Edit,
  Trash2,
  Settings,
  Filter,
  Tag,
  FolderOpen,
} from "lucide-react";
import { useToastContext } from "@/components/providers/toast-provider";
import { dateUtils } from "@/lib/utils";

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

function ManageAlatContent() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    categoryId: "",
  });
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category management states
  const [categoriesForManagement, setCategoriesForManagement] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [categoryCurrentPage, setCategoryCurrentPage] = useState(1);
  const [categoryTotalPages, setCategoryTotalPages] = useState(1);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    code: "",
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { showSuccess, showError } = useToastContext();

  const fetchEquipment = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter !== "all" && { categoryId: categoryFilter }),
      });

      const response = await fetch(`/api/equipment/manage?${params}`);
      if (!response.ok) throw new Error("Failed to fetch equipment");

      const data = await response.json();
      setEquipment(data.data);
      setTotalPages(data.pagination.totalPages);
      setCurrentPage(page);
    } catch {
      showError("Gagal memuat data equipment", "Error");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categoryFilter, showError]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/equipment/categories?includeAll=true");
      if (!response.ok) throw new Error("Failed to fetch categories");

      const data = await response.json();
      setCategories(data.data);
    } catch {
      showError("Gagal memuat kategori equipment", "Error");
    }
  }, [showError]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchEquipment(1);
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, categoryFilter, fetchEquipment]);

  const handleAddEquipment = async () => {
    if (!formData.name || !formData.code || !formData.categoryId) {
      showError("Semua field harus diisi", "Error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/equipment/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          categoryId: parseInt(formData.categoryId),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add equipment");
      }

      showSuccess("Equipment berhasil ditambahkan", "Berhasil");

      setIsAddDialogOpen(false);
      setFormData({ name: "", code: "", categoryId: "" });
      fetchEquipment(currentPage);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menambahkan equipment";
      showError(errorMessage, "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEquipment = async () => {
    if (!editingEquipment || !formData.name || !formData.code || !formData.categoryId) {
      showError("Semua field harus diisi", "Error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/equipment/manage/${editingEquipment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          categoryId: parseInt(formData.categoryId),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update equipment");
      }

      showSuccess("Equipment berhasil diperbarui", "Berhasil");

      setIsEditDialogOpen(false);
      setEditingEquipment(null);
      setFormData({ name: "", code: "", categoryId: "" });
      fetchEquipment(currentPage);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui equipment";
      showError(errorMessage, "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEquipment = async (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus equipment ini? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }

    try {
      const response = await fetch(`/api/equipment/manage/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete equipment");
      }

      showSuccess("Equipment berhasil dihapus", "Berhasil");
      fetchEquipment(currentPage);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menghapus equipment";
      showError(errorMessage, "Error");
    }
  };

  const openEditDialog = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setFormData({
      name: equipment.name,
      code: equipment.code,
      categoryId: equipment.categoryId.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "WORKING":
        return "bg-green-100 text-green-800";
      case "STANDBY":
        return "bg-yellow-100 text-yellow-800";
      case "BREAKDOWN":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
  };

  // Category management functions
  const fetchCategoriesPaginated = useCallback(async (page = 1) => {
    try {
      setCategoryLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(categorySearchTerm && { search: categorySearchTerm }),
      });

      const response = await fetch(`/api/equipment/categories?${params}`);
      if (!response.ok) throw new Error("Failed to fetch categories");

      const data = await response.json();
      setCategoriesForManagement(data.data);
      setCategoryTotalPages(data.pagination.totalPages);
      setCategoryCurrentPage(page);
    } catch {
      showError("Gagal memuat data kategori", "Error");
    } finally {
      setCategoryLoading(false);
    }
  }, [categorySearchTerm, showError]);

  const handleAddCategory = async () => {
    if (!categoryFormData.name || !categoryFormData.code) {
      showError("Semua field harus diisi", "Error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/equipment/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryFormData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add category");
      }

      showSuccess("Kategori berhasil ditambahkan", "Berhasil");

      setIsAddCategoryDialogOpen(false);
      setCategoryFormData({ name: "", code: "" });
      fetchCategoriesPaginated(categoryCurrentPage);
      fetchCategories(); // Refresh dropdown categories
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menambahkan kategori";
      showError(errorMessage, "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !categoryFormData.name || !categoryFormData.code) {
      showError("Semua field harus diisi", "Error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/equipment/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryFormData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update category");
      }

      showSuccess("Kategori berhasil diperbarui", "Berhasil");

      setIsEditCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryFormData({ name: "", code: "" });
      fetchCategoriesPaginated(categoryCurrentPage);
      fetchCategories(); // Refresh dropdown categories
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui kategori";
      showError(errorMessage, "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }

    try {
      const response = await fetch(`/api/equipment/categories/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete category");
      }

      showSuccess("Kategori berhasil dihapus", "Berhasil");
      fetchCategoriesPaginated(categoryCurrentPage);
      fetchCategories(); // Refresh dropdown categories
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menghapus kategori";
      showError(errorMessage, "Error");
    }
  };

  const openEditCategoryDialog = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      code: category.code,
    });
    setIsEditCategoryDialogOpen(true);
  };

  const resetCategoryFilters = () => {
    setCategorySearchTerm("");
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchCategoriesPaginated(1);
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [categorySearchTerm, fetchCategoriesPaginated]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Alat</h1>
          <p className="text-muted-foreground">
            Kelola data peralatan dan kategori
          </p>
        </div>
      </div>

      <Tabs defaultValue="equipment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Kategori
          </TabsTrigger>
        </TabsList>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-6">
          {/* Equipment Header */}
          <div className="flex justify-end">
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Equipment
            </Button>
          </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipment.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Working</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {equipment.filter((eq) => eq.currentStatus === "WORKING").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Breakdown</CardTitle>
            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {equipment.filter((eq) => eq.currentStatus === "BREAKDOWN").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategori</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari berdasarkan nama atau kode equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(searchTerm || categoryFilter !== "all") && (
              <Button variant="outline" onClick={resetFilters}>
                Reset Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Equipment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Equipment</CardTitle>
          <CardDescription>
            Kelola semua equipment yang tersedia dalam sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Equipment</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Update</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Settings className="h-8 w-8 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            Tidak ada equipment yang ditemukan
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    equipment.map((eq) => (
                      <TableRow key={eq.id}>
                        <TableCell className="font-medium">{eq.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {eq.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{eq.category.name}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(eq.currentStatus)}>
                            {eq.currentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {dateUtils.formatDateTime(eq.lastStatusChange)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(eq)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteEquipment(eq.id)}
                              disabled={eq._count.operationalReports > 0}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchEquipment(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => fetchEquipment(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Equipment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Equipment</DialogTitle>
            <DialogDescription>
              Tambahkan equipment baru ke dalam sistem
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Equipment</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Masukkan nama equipment"
              />
            </div>
            <div>
              <Label htmlFor="code">Kode Equipment</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="Masukkan kode equipment"
              />
            </div>
            <div>
              <Label htmlFor="category">Kategori</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setFormData({ name: "", code: "", categoryId: "" });
              }}
            >
              Batal
            </Button>
            <Button onClick={handleAddEquipment} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Equipment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>
              Ubah informasi equipment yang dipilih
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nama Equipment</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Masukkan nama equipment"
              />
            </div>
            <div>
              <Label htmlFor="edit-code">Kode Equipment</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="Masukkan kode equipment"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Kategori</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingEquipment(null);
                setFormData({ name: "", code: "", categoryId: "" });
              }}
            >
              Batal
            </Button>
            <Button onClick={handleEditEquipment} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          {/* Categories Header */}
          <div className="flex justify-end">
            <Button onClick={() => setIsAddCategoryDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kategori
            </Button>
          </div>

          {/* Category Stats Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kategori</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoriesForManagement.length}</div>
            </CardContent>
          </Card>

          {/* Category Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter & Pencarian Kategori
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari berdasarkan nama atau kode kategori..."
                      value={categorySearchTerm}
                      onChange={(e) => setCategorySearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {categorySearchTerm && (
                  <Button variant="outline" onClick={resetCategoryFilters}>
                    Reset Filter
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Categories Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Kategori</CardTitle>
              <CardDescription>
                Kelola semua kategori equipment yang tersedia dalam sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoryLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Kategori</TableHead>
                        <TableHead>Kode</TableHead>
                        <TableHead>Jumlah Equipment</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoriesForManagement.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
                              <p className="text-muted-foreground">
                                Tidak ada kategori yang ditemukan
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        categoriesForManagement.map((category) => (
                          <TableRow key={category.id}>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {category.code}
                              </code>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{category._count.equipment}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditCategoryDialog(category)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteCategory(category.id)}
                                  disabled={category._count.equipment > 0}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {/* Category Pagination */}
                  {categoryTotalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => fetchCategoriesPaginated(categoryCurrentPage - 1)}
                        disabled={categoryCurrentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-4">
                        Page {categoryCurrentPage} of {categoryTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => fetchCategoriesPaginated(categoryCurrentPage + 1)}
                        disabled={categoryCurrentPage === categoryTotalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kategori</DialogTitle>
            <DialogDescription>
              Tambahkan kategori baru untuk equipment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Nama Kategori</Label>
              <Input
                id="category-name"
                value={categoryFormData.name}
                onChange={(e) =>
                  setCategoryFormData({ ...categoryFormData, name: e.target.value })
                }
                placeholder="Masukkan nama kategori"
              />
            </div>
            <div>
              <Label htmlFor="category-code">Kode Kategori</Label>
              <Input
                id="category-code"
                value={categoryFormData.code}
                onChange={(e) =>
                  setCategoryFormData({ ...categoryFormData, code: e.target.value })
                }
                placeholder="Masukkan kode kategori"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddCategoryDialogOpen(false);
                setCategoryFormData({ name: "", code: "" });
              }}
            >
              Batal
            </Button>
            <Button onClick={handleAddCategory} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kategori</DialogTitle>
            <DialogDescription>
              Ubah informasi kategori yang dipilih
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category-name">Nama Kategori</Label>
              <Input
                id="edit-category-name"
                value={categoryFormData.name}
                onChange={(e) =>
                  setCategoryFormData({ ...categoryFormData, name: e.target.value })
                }
                placeholder="Masukkan nama kategori"
              />
            </div>
            <div>
              <Label htmlFor="edit-category-code">Kode Kategori</Label>
              <Input
                id="edit-category-code"
                value={categoryFormData.code}
                onChange={(e) =>
                  setCategoryFormData({ ...categoryFormData, code: e.target.value })
                }
                placeholder="Masukkan kode kategori"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditCategoryDialogOpen(false);
                setEditingCategory(null);
                setCategoryFormData({ name: "", code: "" });
              }}
            >
              Batal
            </Button>
            <Button onClick={handleEditCategory} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default function ManageAlatPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "ADMIN") {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Akses Ditolak</h2>
            <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ManageAlatContent />
    </AppLayout>
  );
}