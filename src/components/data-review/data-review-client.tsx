"use client";

import React, { useState, useEffect } from "react";
import { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { DataCategoryTable } from "@/components/data-review";

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
  session 
}: DataReviewClientProps) {
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState("operational-reports");
  const [globalSearch, setGlobalSearch] = useState("");
  const [stats, setStats] = useState<Record<string, number>>({});
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const router = useRouter();

  // Initialize client-side only
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-load stats when component mounts with timeout
  useEffect(() => {
    if (isClient) {
      loadGlobalStats();
      
      // Auto-reload stats every 60 seconds
      const interval = setInterval(loadGlobalStats, 60000);
      return () => clearInterval(interval);
    }
  }, [isClient]);

  // Filter categories based on user access
  const visibleCategories = dataCategories.filter(category => {
    // If department specific, check user access
    if (category.departmentSpecific) {
      return session.user.role === "ADMIN" || 
             session.user.role === "INPUTTER" ||
             session.user.departmentName === category.departmentSpecific;
    }
    return true;
  });

  const loadGlobalStats = async () => {
    try {
      setStatsError(null);
      
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch("/api/data-review/stats", {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || {});
      } else {
        const errorData = await response.json();
        setStats({
          "operational-reports": 0,
          "kta-tta": 0,
          "kpi-utama": 0,
          "maintenance-routine": 0,
          "critical-issues": 0,
          "safety-incidents": 0,
          "energy-targets": 0,
          "energy-consumption": 0,
        });
        setStatsError(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
      
      // Always set some stats even if loading fails
      setStats({
        "operational-reports": 0,
        "kta-tta": 0,
        "kpi-utama": 0,
        "maintenance-routine": 0,
        "critical-issues": 0,
        "safety-incidents": 0,
        "energy-targets": 0,
        "energy-consumption": 0,
      });
      
      if (error instanceof Error && error.name === 'AbortError') {
        setStatsError("Request timeout - stats loading took too long");
      } else {
        setStatsError(error instanceof Error ? error.message : "Failed to load statistics");
      }
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleEdit = (categoryId: string, recordId: number) => {
    // Redirect to appropriate input form with pre-filled data
    const routes = {
      "operational-reports": `/input/daily-activity/edit/${recordId}`,
      "kta-tta": `/input/kta-tta/edit/${recordId}`,
      "kpi-utama": `/input/kpi-utama/edit/${recordId}`,
      "maintenance-routine": `/input/maintenance-routine/edit/${recordId}`,
      "critical-issues": `/input/critical-issues/edit/${recordId}`,
      "safety-incidents": `/input/safety-incidents/edit/${recordId}`,
      "energy-targets": `/input/energy-targets/edit/${recordId}`,
      "energy-consumption": `/input/energy-consumption/edit/${recordId}`,
    };

    const route = routes[categoryId as keyof typeof routes];
    if (route) {
      window.location.href = route;
    }
  };

  const handleDelete = async (categoryId: string, recordId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }

    try {
      const response = await fetch(`/api/data-review/${categoryId}/${recordId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh stats and current tab data
        loadGlobalStats();
        // Force refresh the table component
        router.refresh();
      } else {
        const errorData = await response.json();
        alert(`Gagal menghapus data: ${errorData.error || 'Unknown error'}`);
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
        
        <div className="flex gap-2">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            {isLoadingStats ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                Loading stats...
              </>
            ) : statsError ? (
              <>
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Stats error
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Stats loaded
              </>
            )}
          </div>
          
          {session.user.role !== "VIEWER" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => window.location.href = "/input"}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Tambah Data Baru
            </Button>
          )}
        </div>
      </div>

      {/* Stats Error Alert */}
      {statsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Stats loading error:</strong> {statsError}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={loadGlobalStats}
              className="ml-2 h-auto p-1 text-xs"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Data Category Tabs - SINGLE TABS ONLY */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
          {visibleCategories.map((category) => {
            const IconComponent = getIconComponent(category.icon);
            const count = stats[category.id] || 0;
            
            return (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="flex items-center gap-2 text-xs relative"
              >
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{category.name}</span>
                {count > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs h-4 min-w-4 px-1">
                    {count > 99 ? '99+' : count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {visibleCategories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {React.createElement(getIconComponent(category.icon), { className: "h-5 w-5" })}
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {(stats[category.id] || 0).toLocaleString('id-ID')} records
                    </Badge>
                    {category.departmentSpecific && (
                      <Badge variant="secondary">
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
                  onEdit={(recordId) => handleEdit(category.id, recordId)}
                  onDelete={canDelete() ? (recordId) => handleDelete(category.id, recordId) : undefined}
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
