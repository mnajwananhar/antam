"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Settings, CheckCircle, AlertCircle, XCircle, Clock } from "lucide-react";

interface EquipmentStatusData {
  id: number;
  name: string;
  code: string;
  status: "WORKING" | "STANDBY" | "BREAKDOWN";
  lastUpdate: string;
  category: string;
  uptime?: number; // Percentage uptime in last 24h
}

interface EquipmentStatusSummary {
  total: number;
  working: number;
  standby: number;
  breakdown: number;
  workingPercentage: number;
  standbyPercentage: number;
  breakdownPercentage: number;
}

interface EquipmentStatusDashboardProps {
  equipmentData: EquipmentStatusData[];
  summary: EquipmentStatusSummary;
  loading?: boolean;
}

export function EquipmentStatusDashboard({
  equipmentData,
  summary,
  loading = false,
}: EquipmentStatusDashboardProps): React.JSX.Element {

  const getStatusIcon = (status: EquipmentStatusData["status"]): React.JSX.Element => {
    switch (status) {
      case "WORKING":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "STANDBY":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "BREAKDOWN":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: EquipmentStatusData["status"]): string => {
    switch (status) {
      case "WORKING":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "STANDBY":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
      case "BREAKDOWN":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800";
    }
  };

  const getStatusLabel = (status: EquipmentStatusData["status"]): string => {
    switch (status) {
      case "WORKING":
        return "Beroperasi";
      case "STANDBY":
        return "Standby";
      case "BREAKDOWN":
        return "Breakdown";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <Card className="bg-secondary-50 dark:bg-secondary-800/50 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-secondary-800 dark:text-primary">
            <Settings className="h-5 w-5" />
            Status Alat Real-time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-16 bg-secondary-300 dark:bg-secondary-600 rounded"></div>
                </div>
              ))}
            </div>
            <div className="animate-pulse">
              <div className="h-32 bg-secondary-300 dark:bg-secondary-600 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group equipment by category
  const equipmentByCategory = equipmentData.reduce((acc, equipment) => {
    if (!acc[equipment.category]) {
      acc[equipment.category] = [];
    }
    acc[equipment.category].push(equipment);
    return acc;
  }, {} as Record<string, EquipmentStatusData[]>);

  return (
    <Card className="bg-secondary-50 dark:bg-secondary-800/50 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-secondary-800 dark:text-primary">
          <Settings className="h-5 w-5" />
          Status Alat Real-time
        </CardTitle>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Status operasional seluruh equipment departemen saat ini
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Working Status */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-400">
                  Beroperasi
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                  {summary.working}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={summary.workingPercentage} className="h-2" />
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                {summary.workingPercentage.toFixed(1)}% dari total alat
              </p>
            </div>
          </div>

          {/* Standby Status */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                  Standby
                </p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                  {summary.standby}
                </p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={summary.standbyPercentage} className="h-2" />
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                {summary.standbyPercentage.toFixed(1)}% dari total alat
              </p>
            </div>
          </div>

          {/* Breakdown Status */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-400">
                  Breakdown
                </p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-300">
                  {summary.breakdown}
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-full">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={summary.breakdownPercentage} className="h-2" />
              <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                {summary.breakdownPercentage.toFixed(1)}% dari total alat
              </p>
            </div>
          </div>
        </div>

        {/* Equipment List by Category */}
        <div className="space-y-4">
          {Object.entries(equipmentByCategory).map(([category, equipment]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                {category} ({equipment.length} alat)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {equipment.map((item) => (
                  <div
                    key={item.id}
                    className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-3 bg-white dark:bg-secondary-800 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className="font-medium text-sm text-secondary-800 dark:text-secondary-200">
                          {item.code}
                        </span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(item.status)}`}
                      >
                        {getStatusLabel(item.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-2">
                      {item.name}
                    </p>
                    {item.uptime !== undefined && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-secondary-500 dark:text-secondary-400">
                            Uptime 24h
                          </span>
                          <span className="text-secondary-700 dark:text-secondary-300">
                            {item.uptime.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={item.uptime} className="h-1.5" />
                      </div>
                    )}
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2">
                      Update: {new Date(item.lastUpdate).toLocaleString("id-ID")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {equipmentData.length === 0 && (
          <div className="text-center py-8">
            <Settings className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-500 dark:text-secondary-400">
              Tidak ada data status alat tersedia
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}