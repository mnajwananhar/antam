"use client";

import React, { useState, useEffect } from "react";
import { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Activity,
  ClipboardList,
  TrendingUp,
  Wrench,
  AlertTriangle,
  ShieldAlert,
  Zap,
  Battery,
  Plus,
  AlertCircle,
} from "lucide-react";
import { DataCategoryTable } from "./data-category-table";

interface Department {
  id: number;
  name: string;
  code: string;
}

interface DataCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  table: string;
  filter?: string;
  departmentSpecific?: string;
}

interface DataReviewClientProps {
  departments: Department[];
  dataCategories: DataCategory[];
  session: Session;
}

const getIconComponent = (iconName: string) => {
  const icons = {
    activity: Activity,
    "clipboard-list": ClipboardList,
    "trending-up": TrendingUp,
    wrench: Wrench,
    "alert-triangle": AlertTriangle,
    "shield-alert": ShieldAlert,
    zap: Zap,
    battery: Battery,
  };
  return icons[iconName as keyof typeof icons] || Activity;
};

export function DataReviewClient({
  departments,
  dataCategories,
  session,
}: DataReviewClientProps) {
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState("operational-reports");
  const [globalSearch, setGlobalSearch] = useState("");
  const router = useRouter();

  // Initialize client-side only
  useEffect(() => {
    setIsClient(true);
  }, []);


  // Filter categories based on user access
  const visibleCategories = dataCategories.filter((category) => {
    // If department specific, check user access
    if (category.departmentSpecific) {
      return (
        session.user.role === "ADMIN" ||
        session.user.role === "INPUTTER" ||
        session.user.departmentName === category.departmentSpecific
      );
    }
    return true;
  });


  // Note: Edit handling is now done in DataCategoryTable component

  const handleDelete = async (categoryId: string, recordId: number) => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/data-review/${categoryId}/${recordId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Force refresh the table component
        router.refresh();
      } else {
        const errorData = await response.json();
        alert(`Gagal menghapus data: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Terjadi kesalahan saat menghapus data.");
    }
  };

  const canEdit = (category: DataCategory) => {
    if (session.user.role === "VIEWER") return false;
    if (session.user.role === "ADMIN") return true;
    if (session.user.role === "INPUTTER") return true;

    // Planner can edit their department data
    if (session.user.role === "PLANNER") {
      if (category.departmentSpecific) {
        return session.user.departmentName === category.departmentSpecific;
      }
      return true;
    }

    return false;
  };

  const canDelete = () => {
    return session.user.role === "ADMIN";
  };

  // Don't render until client-side to prevent hydration issues
  if (!isClient) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cari data di semua kategori..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {session.user.role !== "VIEWER" && (
          <Button
            variant="default"
            size="sm"
            onClick={() => (window.location.href = "/input")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Tambah Data Baru
          </Button>
        )}
      </div>


      {/* Data Category Tabs - RESPONSIVE TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Mobile: Use scrollable tabs */}
        <div className="md:hidden">
          <TabsList className="flex w-full overflow-x-auto scrollbar-hide gap-1 p-1">
            {visibleCategories.map((category) => {
              const IconComponent = getIconComponent(category.icon);
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center gap-2 text-xs whitespace-nowrap px-3 py-2 min-w-fit"
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="text-xs">{category.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
        
        {/* Desktop: Use flex layout */}
        <div className="hidden md:block">
          <TabsList className="flex w-full flex-wrap justify-start gap-1 p-1 h-auto">
            {visibleCategories.map((category) => {
              const IconComponent = getIconComponent(category.icon);
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex flex-col items-center gap-1 text-xs p-2 h-auto min-w-[100px] flex-1"
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="text-xs leading-tight text-center">{category.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {visibleCategories.map((category) => (
          <TabsContent
            key={category.id}
            value={category.id}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {React.createElement(getIconComponent(category.icon), {
                      className: "h-5 w-5 flex-shrink-0",
                    })}
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-lg truncate">{category.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {category.departmentSpecific && (
                      <Badge variant="secondary" className="text-xs">
                        {category.departmentSpecific}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <DataCategoryTable
                  key={`${category.id}-${activeTab}`}
                  category={category}
                  globalSearch={globalSearch}
                  session={session}
                  onEdit={() => {}} // Handled by DataCategoryTable internally
                  onDelete={
                    canDelete()
                      ? (recordId) => handleDelete(category.id, recordId)
                      : undefined
                  }
                  canEdit={canEdit(category)}
                  departments={departments}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Access Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Akses Anda:</strong> {session.user.role}
          {session.user.departmentName && ` • ${session.user.departmentName}`}
          {session.user.role === "ADMIN" && " • Full access ke semua data"}
          {session.user.role === "PLANNER" && " • Akses data departemen"}
          {session.user.role === "INPUTTER" && " • Akses input semua data"}
          {session.user.role === "VIEWER" && " • Read-only access"}
        </AlertDescription>
      </Alert>
    </div>
  );
}
