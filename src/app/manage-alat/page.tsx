"use client";

import { useState, useEffect, useRef } from "react";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

import { UniversalTable } from "@/components/ui/universal-table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  createEquipmentColumns,
  createEquipmentActions,
  createEquipmentFilters,
  createCategoryColumns,
  createCategoryActions,

} from "./equipment-table-config";
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
  Settings,
  Tag,
  FolderOpen,
} from "lucide-react";
import { useStandardFeedback } from "@/lib/hooks/use-standard-feedback";

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
  const [totalItems, setTotalItems] = useState(0);
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
  const [categoryTotalItems, setCategoryTotalItems] = useState(0);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    code: "",
  });

  // Stats states for overall data
  const [equipmentStats, setEquipmentStats] = useState({
    total: 0,
    working: 0,
    breakdown: 0,
    standby: 0,
  });
  const [totalCategories, setTotalCategories] = useState(0);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { feedback, crud, ConfirmationComponent } = useStandardFeedback();
  
  // Use ref to avoid feedback dependency issues
  const feedbackRef = useRef(feedback);
  feedbackRef.current = feedback;

  // Helper functions for refetching data after CRUD operations
  const refetchEquipmentData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter !== "all" && { categoryId: categoryFilter }),
      });

      const [equipmentResponse, statsResponse] = await Promise.all([
        fetch(`/api/equipment/manage?${params}`),
        fetch(`/api/equipment/manage?stats=true${searchTerm ? `&search=${searchTerm}` : ''}${categoryFilter !== "all" ? `&categoryId=${categoryFilter}` : ''}`)
      ]);

      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json();
        setEquipment(equipmentData.data);
        setTotalPages(equipmentData.pagination.totalPages);
        setTotalItems(equipmentData.pagination.total);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setEquipmentStats({
          total: statsData.stats.total,
          working: statsData.stats.working,
          breakdown: statsData.stats.breakdown,
          standby: statsData.stats.standby,
        });
      }
    } catch (error) {
      console.error("Error refetching equipment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const refetchCategoryData = async () => {
    try {
      const [dropdownResponse, managementResponse, statsResponse] = await Promise.all([
        fetch("/api/equipment/categories?includeAll=true"),
        fetch(`/api/equipment/categories?page=${categoryCurrentPage}&limit=10${categorySearchTerm ? `&search=${categorySearchTerm}` : ''}`),
        fetch("/api/equipment/categories?stats=true")
      ]);

      if (dropdownResponse.ok) {
        const dropdownData = await dropdownResponse.json();
        setCategories(dropdownData.data);
      }

      if (managementResponse.ok) {
        const managementData = await managementResponse.json();
        setCategoriesForManagement(managementData.data);
        setCategoryTotalPages(managementData.pagination.totalPages);
        setCategoryTotalItems(managementData.pagination.total);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setTotalCategories(statsData.stats.total);
      }
    } catch (error) {
      console.error("Error refetching category data:", error);
    }
  };

  // Initial load - hanya sekali tanpa filter
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load categories for dropdown
        const categoriesResponse = await fetch("/api/equipment/categories?includeAll=true");
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.data);
        }
        
        // Load category stats
        const statsResponse = await fetch("/api/equipment/categories?stats=true");
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setTotalCategories(statsData.stats.total);
        }
        
        // Load categories for management (paginated)
        setCategoryLoading(true); // Set loading state
        const categoryManagementResponse = await fetch("/api/equipment/categories?page=1&limit=10");
        if (categoryManagementResponse.ok) {
          const managementData = await categoryManagementResponse.json();
          setCategoriesForManagement(managementData.data);
          setCategoryTotalPages(managementData.pagination.totalPages);
          setCategoryTotalItems(managementData.pagination.total);
          setCategoryCurrentPage(1);
        }
        setCategoryLoading(false); // Clear loading state
      } catch (error) {
        console.error("Error loading initial data:", error);
        feedbackRef.current.error("Gagal memuat data awal");
        setCategoryLoading(false); // Clear loading state on error
      }
    };
    
    loadInitialData();
  }, []); // Empty dependency - hanya run sekali saat mount

  // Load equipment dan stats berdasarkan filter/search dengan debouncing
  useEffect(() => {
    const delayedSearch = setTimeout(async () => {
      try {
        // Fetch equipment with filters
        setLoading(true);
        const equipmentParams = new URLSearchParams({
          page: "1",
          limit: "10",
          ...(searchTerm && { search: searchTerm }),
          ...(categoryFilter !== "all" && { categoryId: categoryFilter }),
        });

        const equipmentResponse = await fetch(`/api/equipment/manage?${equipmentParams}`);
        if (equipmentResponse.ok) {
          const equipmentData = await equipmentResponse.json();
          setEquipment(equipmentData.data);
          setTotalPages(equipmentData.pagination.totalPages);
          setTotalItems(equipmentData.pagination.total);
          setCurrentPage(1);
        }

        // Fetch equipment stats with same filters
        const statsParams = new URLSearchParams({
          stats: "true",
          ...(searchTerm && { search: searchTerm }),
          ...(categoryFilter !== "all" && { categoryId: categoryFilter }),
        });
        
        const statsResponse = await fetch(`/api/equipment/manage?${statsParams}`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setEquipmentStats({
            total: statsData.stats.total,
            working: statsData.stats.working,
            breakdown: statsData.stats.breakdown,
            standby: statsData.stats.standby,
          });
        }
      } catch (error) {
        console.error("Error fetching equipment data:", error);
        feedbackRef.current.error("Gagal memuat data equipment");
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, categoryFilter]); // Hanya depend on values, bukan functions

  const handleAddEquipment = async () => {
    if (!formData.name || !formData.code || !formData.categoryId) {
      feedback.error("Semua field harus diisi");
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

      feedback.created("Equipment");

      setIsAddDialogOpen(false);
      setFormData({ name: "", code: "", categoryId: "" });
      refetchEquipmentData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menambahkan equipment";
      feedback.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEquipment = async () => {
    if (!editingEquipment || !formData.name || !formData.code || !formData.categoryId) {
      feedback.error("Semua field harus diisi");
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

      feedback.updated("Equipment");

      setIsEditDialogOpen(false);
      setEditingEquipment(null);
      setFormData({ name: "", code: "", categoryId: "" });
      refetchEquipmentData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui equipment";
      feedback.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEquipment = async (id: number) => {
    await crud.delete(
      () => fetch(`/api/equipment/manage/${id}`, { method: "DELETE" }),
      "equipment", 
      () => {
        refetchEquipmentData();
      }
    );
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





  // Category management functions - inline implementations to avoid useCallback dependencies

  const handleAddCategory = async () => {
    if (!categoryFormData.name || !categoryFormData.code) {
      feedback.error("Semua field harus diisi");
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

      feedback.created("Kategori");

      setIsAddCategoryDialogOpen(false);
      setCategoryFormData({ name: "", code: "" });
      refetchCategoryData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menambahkan kategori";
      feedback.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !categoryFormData.name || !categoryFormData.code) {
      feedback.error("Semua field harus diisi");
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

      feedback.updated("Kategori");

      setIsEditCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryFormData({ name: "", code: "" });
      refetchCategoryData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui kategori";
      feedback.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    await crud.delete(
      () => fetch(`/api/equipment/categories/${id}`, { method: "DELETE" }),
      "kategori",
      () => {
        refetchCategoryData();
      }
    );
  };

  const openEditCategoryDialog = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      code: category.code,
    });
    setIsEditCategoryDialogOpen(true);
  };



  // Search dengan debouncing untuk category management - hanya untuk search
  useEffect(() => {
    if (categorySearchTerm === "") return; // Skip jika search kosong (initial state)
    
    const delayedSearch = setTimeout(async () => {
      try {
        setCategoryLoading(true);
        const params = new URLSearchParams({
          page: "1",
          limit: "10",
          search: categorySearchTerm,
        });

        const response = await fetch(`/api/equipment/categories?${params}`);
        if (response.ok) {
          const data = await response.json();
          setCategoriesForManagement(data.data);
          setCategoryTotalPages(data.pagination.totalPages);
          setCategoryTotalItems(data.pagination.total);
          setCategoryCurrentPage(1);
        }
      } catch (error) {
        console.error("Error searching categories:", error);
        feedbackRef.current.error("Gagal mencari kategori");
      } finally {
        setCategoryLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [categorySearchTerm]); // Hanya depend on search term

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Manage Alat</h1>
          <p className="text-muted-foreground">
            Kelola data peralatan dan kategori
          </p>
        </div>
      </div>

      <Tabs defaultValue="equipment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto sm:mx-0">
          <TabsTrigger value="equipment" className="flex items-center gap-2 text-xs sm:text-sm">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Equipment</span>
            <span className="sm:hidden">Alat</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2 text-xs sm:text-sm">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Kategori</span>
            <span className="sm:hidden">Kat.</span>
          </TabsTrigger>
        </TabsList>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-6">
          {/* Equipment Header */}
          <div className="flex justify-center sm:justify-end">
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Tambah Equipment</span>
              <span className="sm:hidden">Tambah Alat</span>
            </Button>
          </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Equipment</CardTitle>
            <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{equipmentStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Working</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {equipmentStats.working}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Breakdown</CardTitle>
            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {equipmentStats.breakdown}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Kategori</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalCategories}</div>
          </CardContent>
        </Card>
      </div>



      {/* Equipment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Equipment</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton 
              columns={7}
              rows={6}
              showSearch={true}
              showFilters={true}
              showPagination={true}
            />
          ) : (
            <>
              <UniversalTable<Equipment>
                data={equipment}
                columns={createEquipmentColumns()}
                actions={createEquipmentActions(openEditDialog, handleDeleteEquipment)}
                loading={loading}
                emptyState={{
                    icon: <Settings className="h-8 w-8" />,
                    title: "Tidak ada equipment yang ditemukan",
                  }}
                pagination={{
                  currentPage,
                  totalPages,
                  pageSize: 10,
                  totalItems,
                  onPageChange: async (page) => {
                    try {
                      setLoading(true);
                      const params = new URLSearchParams({
                        page: page.toString(),
                        limit: "10",
                        ...(searchTerm && { search: searchTerm }),
                        ...(categoryFilter !== "all" && { categoryId: categoryFilter }),
                      });

                      const response = await fetch(`/api/equipment/manage?${params}`);
                      if (response.ok) {
                        const data = await response.json();
                        setEquipment(data.data);
                        setTotalPages(data.pagination.totalPages);
                        setTotalItems(data.pagination.total);
                        setCurrentPage(page);
                      }
                    } catch (error) {
                      console.error("Error fetching equipment page:", error);
                      feedbackRef.current.error("Gagal memuat halaman equipment");
                    } finally {
                      setLoading(false);
                    }
                  },
                }}
                searchable={{
                  placeholder: "Cari berdasarkan nama atau kode equipment...",
                  value: searchTerm,
                  onChange: setSearchTerm,
                }}
                filters={createEquipmentFilters(categories, categoryFilter, setCategoryFilter)}
              />
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

          {/* Categories Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              <UniversalTable
                data={categoriesForManagement}
                columns={createCategoryColumns()}
                actions={createCategoryActions(
                  openEditCategoryDialog,
                  handleDeleteCategory
                )}
                searchable={{
                  placeholder: "Cari berdasarkan nama atau kode...",
                  value: categorySearchTerm,
                  onChange: setCategorySearchTerm,
                }}
                pagination={{
                  currentPage: categoryCurrentPage,
                  totalPages: categoryTotalPages,
                  pageSize: 10,
                  totalItems: categoryTotalItems,
                  onPageChange: async (page) => {
                    try {
                      setCategoryLoading(true);
                      const params = new URLSearchParams({
                        page: page.toString(),
                        limit: "10",
                        ...(categorySearchTerm && { search: categorySearchTerm }),
                      });

                      const response = await fetch(`/api/equipment/categories?${params}`);
                      if (response.ok) {
                        const data = await response.json();
                        setCategoriesForManagement(data.data);
                        setCategoryTotalPages(data.pagination.totalPages);
                        setCategoryTotalItems(data.pagination.total);
                        setCategoryCurrentPage(page);
                      }
                    } catch (error) {
                      console.error("Error fetching category page:", error);
                      feedbackRef.current.error("Gagal memuat halaman kategori");
                    } finally {
                      setCategoryLoading(false);
                    }
                  },
                }}
                loading={categoryLoading}
                emptyState={{
                  icon: <FolderOpen className="h-8 w-8 text-muted-foreground/50" />,
                  title: "Tidak ada kategori yang ditemukan",
                  description: "Belum ada kategori yang tersedia atau sesuai dengan pencarian Anda.",
                }}
                className="mt-4"
              />
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

      {/* Confirmation Dialog */}
      {ConfirmationComponent}
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