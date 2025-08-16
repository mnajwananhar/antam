"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calendar, TrendingUp } from "lucide-react";

import { SafetyIncidentsChart } from "./safety-incidents-chart";
import { EnergyIkesChart } from "./energy-ikes-chart";
import { EnergyEmissionChart } from "./energy-emission-chart";
import { EnergyConsumptionChart } from "./energy-consumption-chart";
import { CriticalIssuesTable } from "./critical-issues-table";
import { KpiKtaChart } from "../operational/kpi-kta-chart";

import {
  SafetyFilters,
  EnergyFilters,
  ConsumptionFilters,
  CriticalIssuesFilters,
  type SafetyFilterState,
  type EnergyFilterState,
  type ConsumptionFilterState,
  type CriticalIssuesFilterState,
} from "@/components/dashboard/filters";

interface DashboardData {
  safetyIncidents: Array<{
    month: string;
    nearmiss: number;
    kecAlat: number;
    kecKecil: number;
    kecRingan: number;
    kecBerat: number;
    fatality: number;
  }>;
  energyIkes: Array<{
    month: string;
    ikesTarget: number | null;
    ikesRealization: number | null;
  }>;
  energyEmission: Array<{
    month: string;
    emissionTarget: number | null;
    emissionRealization: number | null;
  }>;
  energyConsumption: Array<{
    month: string;
    tambang: number;
    pabrik: number;
    supporting: number;
    total: number;
  }>;
  criticalIssues: Array<{
    id: number;
    issueName: string;
    department: string;
    status: string;
    description: string;
    createdAt: string;
  }>;
  kpiUtama?: {
    rencana: number;
    aktual: number;
  };
  availableYears: number[];
  year: number;
  month: number;
  monthName: string;
}

export function MtcEngDashboard(): React.JSX.Element {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const currentYear = new Date().getFullYear();

  // Client-side filters for charts that need them
  const [safetyFilters, setSafetyFilters] = useState<SafetyFilterState>({
    year: currentYear,
    monthRange: { start: 1, end: 12 },
    incidentTypes: {
      nearmiss: true,
      kecAlat: true,
      kecKecil: true,
      kecRingan: true,
      kecBerat: true,
      fatality: true,
    },
    chartType: "stacked",
  });

  const [energyFilters, setEnergyFilters] = useState<EnergyFilterState>({
    year: currentYear,
    monthRange: { start: 1, end: 12 },
    showTarget: true,
    showRealization: true,
    comparisonMode: "target_vs_real",
    smoothLine: false,
  });

  const [consumptionFilters, setConsumptionFilters] =
    useState<ConsumptionFilterState>({
      year: currentYear,
      monthRange: { start: 1, end: 12 },
      areas: {
        tambang: true,
        pabrik: true,
        supporting: true,
      },
      showTotal: true,
      chartType: "combined",
      showTable: true,
      showAverage: true,
    });

  const [criticalFilters, setCriticalFilters] =
    useState<CriticalIssuesFilterState>({
      departments: [],
      statuses: { WORKING: true, STANDBY: true, BREAKDOWN: true },
      dateRange: "all",
      sortBy: "newest",
      sortOrder: "desc",
      pageSize: 10,
    });

  // API fetch with year dependency from filters
  const fetchDashboardData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("year", currentYear.toString());

      const response = await fetch(
        `/api/dashboard/mtceng?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const dashboardData = await response.json();
      setData(dashboardData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = (): void => {
    fetchDashboardData();
  };

  // Filter data based on current filters
  const getFilteredSafetyData = useCallback(() => {
    if (!data) return [];

    return data.safetyIncidents
      .filter((item, index) => {
        const monthNum = index + 1;
        return (
          monthNum >= safetyFilters.monthRange.start &&
          monthNum <= safetyFilters.monthRange.end
        );
      })
      .map((item) => ({
        ...item,
        nearmiss: safetyFilters.incidentTypes.nearmiss ? item.nearmiss : 0,
        kecAlat: safetyFilters.incidentTypes.kecAlat ? item.kecAlat : 0,
        kecKecil: safetyFilters.incidentTypes.kecKecil ? item.kecKecil : 0,
        kecRingan: safetyFilters.incidentTypes.kecRingan ? item.kecRingan : 0,
        kecBerat: safetyFilters.incidentTypes.kecBerat ? item.kecBerat : 0,
        fatality: safetyFilters.incidentTypes.fatality ? item.fatality : 0,
      }));
  }, [data, safetyFilters]);

  const getFilteredEnergyIkesData = useCallback(() => {
    if (!data) return [];

    return data.energyIkes
      .filter((_, index) => {
        const monthNum = index + 1;
        return (
          monthNum >= energyFilters.monthRange.start &&
          monthNum <= energyFilters.monthRange.end
        );
      })
      .map((item) => ({
        ...item,
        ikesTarget: energyFilters.showTarget ? item.ikesTarget : null,
        ikesRealization: energyFilters.showRealization
          ? item.ikesRealization
          : null,
      }));
  }, [data, energyFilters]);

  const getFilteredEnergyEmissionData = useCallback(() => {
    if (!data) return [];

    return data.energyEmission
      .filter((_, index) => {
        const monthNum = index + 1;
        return (
          monthNum >= energyFilters.monthRange.start &&
          monthNum <= energyFilters.monthRange.end
        );
      })
      .map((item) => ({
        ...item,
        emissionTarget: energyFilters.showTarget ? item.emissionTarget : null,
        emissionRealization: energyFilters.showRealization
          ? item.emissionRealization
          : null,
      }));
  }, [data, energyFilters]);

  const getFilteredConsumptionData = useCallback(() => {
    if (!data) return [];

    return data.energyConsumption
      .filter((_, index) => {
        const monthNum = index + 1;
        return (
          monthNum >= consumptionFilters.monthRange.start &&
          monthNum <= consumptionFilters.monthRange.end
        );
      })
      .map((item) => ({
        ...item,
        tambang: consumptionFilters.areas.tambang ? item.tambang : 0,
        pabrik: consumptionFilters.areas.pabrik ? item.pabrik : 0,
        supporting: consumptionFilters.areas.supporting ? item.supporting : 0,
        total: consumptionFilters.showTotal ? item.total : 0,
      }));
  }, [data, consumptionFilters]);

  const getFilteredCriticalIssues = useCallback(() => {
    if (!data) return [];

    let filtered = data.criticalIssues;

    // Department filter
    if (criticalFilters.departments.length > 0) {
      filtered = filtered.filter((issue) =>
        criticalFilters.departments.includes(issue.department)
      );
    }

    // Status filter
    const enabledStatuses = Object.entries(criticalFilters.statuses)
      .filter(([, enabled]) => enabled)
      .map(([status]) => status);

    if (enabledStatuses.length < 3) {
      filtered = filtered.filter((issue) =>
        enabledStatuses.includes(issue.status)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (criticalFilters.sortBy) {
        case "newest":
          comparison =
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case "oldest":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "department":
          comparison = a.department.localeCompare(b.department);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "priority":
          // Simple priority: BREAKDOWN > STANDBY > WORKING
          const priorityOrder = { BREAKDOWN: 3, STANDBY: 2, WORKING: 1 };
          comparison =
            (priorityOrder[b.status as keyof typeof priorityOrder] || 0) -
            (priorityOrder[a.status as keyof typeof priorityOrder] || 0);
          break;
      }

      return criticalFilters.sortOrder === "desc" ? comparison : -comparison;
    });

    // Pagination
    return filtered.slice(0, criticalFilters.pageSize);
  }, [data, criticalFilters]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Dashboard MTC&ENG Bureau
            </h1>
            <p className="text-secondary-400">Loading dashboard data...</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card
              key={index}
              className="bg-secondary-800/50 border-primary-600/30"
            >
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-secondary-700 rounded w-1/3 mb-4"></div>
                  <div className="h-32 bg-secondary-700 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Dashboard MTC&ENG Bureau
            </h1>
            <p className="text-secondary-400">Error loading dashboard</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>

        <Card className="bg-red-900/20 border-red-600/30">
          <CardContent className="p-6 text-center">
            <p className="text-red-400">Error: {error}</p>
            <p className="text-secondary-400 mt-2">
              Please try refreshing the page or contact support if the problem
              persists.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Dashboard MTC&ENG Bureau
            </h1>
            <p className="text-secondary-400">No data available</p>
          </div>
        </div>

        <Card className="bg-secondary-800/50 border-primary-600/30">
          <CardContent className="p-6 text-center">
            <p className="text-secondary-400">No dashboard data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredSafetyData = getFilteredSafetyData();
  const filteredEnergyIkesData = getFilteredEnergyIkesData();
  const filteredEnergyEmissionData = getFilteredEnergyEmissionData();
  const filteredConsumptionData = getFilteredConsumptionData();
  const filteredCriticalIssues = getFilteredCriticalIssues();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Dashboard MTC&ENG Bureau
          </h1>
          <p className="text-secondary-400 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Period:{" "}
            {new Date().toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString("id-ID")}
          </p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="space-y-6">
        {/* KPI Utama Dashboard */}
        {data.kpiUtama && (
          <KpiKtaChart
            kpiData={data.kpiUtama}
            department="MTCENG"
            currentMonth={data.monthName}
          />
        )}

        {/* Safety Incidents Chart with Filter */}
        <div className="space-y-4">
          <SafetyFilters
            currentFilters={safetyFilters}
            onFilterChange={setSafetyFilters}
            availableYears={data?.availableYears}
          />
          <SafetyIncidentsChart
            data={filteredSafetyData}
            chartType={safetyFilters.chartType}
          />
        </div>

        {/* Energy Charts Row with Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <EnergyFilters
              currentFilters={energyFilters}
              onFilterChange={setEnergyFilters}
              chartType="ikes"
              availableYears={data?.availableYears}
            />
            <EnergyIkesChart
              data={filteredEnergyIkesData}
              smoothLine={energyFilters.smoothLine}
              comparisonMode={energyFilters.comparisonMode}
            />
          </div>

          <div className="space-y-4">
            <EnergyFilters
              currentFilters={energyFilters}
              onFilterChange={setEnergyFilters}
              chartType="emission"
              availableYears={data?.availableYears}
            />
            <EnergyEmissionChart
              data={filteredEnergyEmissionData}
              smoothLine={energyFilters.smoothLine}
              comparisonMode={energyFilters.comparisonMode}
            />
          </div>
        </div>

        {/* Energy Consumption Chart with Filter */}
        <div className="space-y-4">
          <ConsumptionFilters
            currentFilters={consumptionFilters}
            onFilterChange={setConsumptionFilters}
            availableYears={data?.availableYears}
          />
          <EnergyConsumptionChart
            data={filteredConsumptionData}
            chartType={consumptionFilters.chartType}
            showTable={consumptionFilters.showTable}
            showAverage={consumptionFilters.showAverage}
          />
        </div>

        {/* Critical Issues Table with Filter */}
        <div className="space-y-4">
          <CriticalIssuesFilters
            currentFilters={criticalFilters}
            onFilterChange={setCriticalFilters}
            totalCount={data.criticalIssues.length}
            filteredCount={filteredCriticalIssues.length}
          />
          <CriticalIssuesTable data={filteredCriticalIssues} />
        </div>
      </div>
    </div>
  );
}
