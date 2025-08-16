"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calendar, TrendingUp, ArrowLeft } from "lucide-react";
import Link from "next/link";

import {
  AvailabilityChart,
  UtilizationChart,
  CriticalIssuesTable,
  EquipmentStatusCard,
  NotificationSpeedometer,
  OrderSpeedometer,
  ProductivityFilters,
  KpiKtaChart,
} from "@/components/dashboard/operational";

type PeriodType = "daily" | "weekly" | "monthly" | "yearly";

interface EquipmentOption {
  id: number;
  name: string;
  code: string;
  category: string;
}

interface ProductivityDataPoint {
  period: string;
  pa: number | null;
  ma: number | null;
  ua: number | null;
  eu: number | null;
}

interface CriticalIssue {
  id: number;
  issueName: string;
  department: string;
  status: string;
  description: string;
  createdAt: string;
}

interface EquipmentStatus {
  id: number;
  equipmentName: string;
  equipmentCode: string;
  status: "WORKING" | "STANDBY" | "BREAKDOWN";
  lastUpdated: string;
  category: string;
}

interface DashboardData {
  productivityData: ProductivityDataPoint[];
  criticalIssues: CriticalIssue[];
  equipmentStatus: EquipmentStatus[];
  availableEquipment: EquipmentOption[];
  notifications: {
    total: number;
    completed: number;
  };
  orders: {
    totalOrders: number;
    totalActivities: number;
    completedActivities: number;
  };
  ktaTta?: {
    rencana: number;
    aktual: number;
  };
  monthName?: string;
}

interface OperationalDashboardProps {
  departmentCode: string;
  departmentName: string;
}

export function OperationalDashboard({
  departmentCode,
  departmentName,
}: OperationalDashboardProps): React.JSX.Element {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Filter states
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("monthly");
  const [selectedEquipment, setSelectedEquipment] = useState<number[]>([]);

  // API fetch
  const fetchDashboardData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("department", departmentCode);
      params.set("period", selectedPeriod);
      if (selectedEquipment.length > 0) {
        params.set("equipment", selectedEquipment.join(","));
      }

      const response = await fetch(
        `/api/dashboard/operational?${params.toString()}`
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
  }, [departmentCode, selectedPeriod, selectedEquipment]);

  // Auto-select first equipment when available equipment loads
  useEffect(() => {
    if (data?.availableEquipment && data.availableEquipment.length > 0 && selectedEquipment.length === 0) {
      setSelectedEquipment([data.availableEquipment[0].id]);
    }
  }, [data?.availableEquipment, selectedEquipment.length]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = (): void => {
    fetchDashboardData();
  };

  const handleFiltersReset = (): void => {
    setSelectedPeriod("monthly");
    setSelectedEquipment([]);
  };

  const handleEquipmentChange = (equipmentIds: number[]): void => {
    setSelectedEquipment(equipmentIds);
  };

  const handlePeriodChange = (period: PeriodType): void => {
    setSelectedPeriod(period);
  };

  // Prepare chart data
  const availabilityData = data?.productivityData.map(item => ({
    period: item.period,
    pa: item.pa,
    ma: item.ma,
  })) || [];

  const utilizationData = data?.productivityData.map(item => ({
    period: item.period,
    ua: item.ua,
    eu: item.eu,
  })) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Dashboard {departmentName}
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
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Dashboard {departmentName}
            </h1>
            <p className="text-secondary-400">Error loading dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
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
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Dashboard {departmentName}
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Dashboard {departmentName}
          </h1>
          <p className="text-secondary-400 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Department: {departmentCode} | Period: {selectedPeriod}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString("id-ID")}
          </p>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ProductivityFilters
        selectedPeriod={selectedPeriod}
        selectedEquipment={selectedEquipment}
        availableEquipment={data.availableEquipment}
        onPeriodChange={handlePeriodChange}
        onEquipmentChange={handleEquipmentChange}
        onReset={handleFiltersReset}
        isLoading={loading}
      />

      {/* Dashboard Grid */}
      <div className="space-y-6">
        {/* KTA TTA Dashboard */}
        {data.ktaTta && (
          <KpiKtaChart
            ktaData={data.ktaTta}
            department={departmentCode}
            currentMonth={data.monthName || new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date())}
          />
        )}

        {/* Productivity Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AvailabilityChart
            data={availabilityData}
            isLoading={loading}
          />
          <UtilizationChart
            data={utilizationData}
            isLoading={loading}
          />
        </div>

        {/* Status and Progress Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <EquipmentStatusCard
            data={data.equipmentStatus}
            isLoading={loading}
            departmentFilter={departmentCode}
          />
          <NotificationSpeedometer
            totalNotifications={data.notifications.total}
            completedNotifications={data.notifications.completed}
            isLoading={loading}
            departmentFilter={departmentCode}
          />
          <OrderSpeedometer
            totalOrders={data.orders.totalOrders}
            totalActivities={data.orders.totalActivities}
            completedActivities={data.orders.completedActivities}
            isLoading={loading}
            departmentFilter={departmentCode}
          />
        </div>

        {/* Critical Issues Table */}
        <CriticalIssuesTable
          data={data.criticalIssues}
          isLoading={loading}
          departmentFilter={departmentCode}
        />
      </div>
    </div>
  );
}
