"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface EquipmentStatus {
  id: number;
  equipmentName: string;
  equipmentCode: string;
  status: "WORKING" | "STANDBY" | "BREAKDOWN";
  lastUpdated: string;
  category: string;
}

interface EquipmentStatusCardProps {
  data: EquipmentStatus[];
  isLoading?: boolean;
  departmentFilter?: string;
}

export function EquipmentStatusCard({ 
  data, 
  isLoading = false,
  departmentFilter 
}: EquipmentStatusCardProps): React.JSX.Element {
  const getStatusIcon = (status: string): React.JSX.Element => {
    switch (status) {
      case "WORKING":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "STANDBY":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "BREAKDOWN":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "WORKING":
        return "bg-green-600 text-white";
      case "STANDBY":
        return "bg-yellow-600 text-black";
      case "BREAKDOWN":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "WORKING":
        return "Working";
      case "STANDBY":
        return "Standby";
      case "BREAKDOWN":
        return "Breakdown";
      default:
        return status;
    }
  };

  const statusCounts = data.reduce((acc, equipment) => {
    acc[equipment.status] = (acc[equipment.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalEquipment = data.length;
  const workingCount = statusCounts.WORKING || 0;
  const standbyCount = statusCounts.STANDBY || 0;
  const breakdownCount = statusCounts.BREAKDOWN || 0;

  if (isLoading) {
    return (
      <Card className="bg-secondary-800/50 border-primary/30">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <div className="animate-pulse bg-secondary-700 h-6 w-32 rounded"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse bg-secondary-700 h-16 rounded"></div>
              ))}
            </div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse bg-secondary-700 h-12 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-secondary-800/50 border-primary/30">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Equipment Status
          {departmentFilter && (
            <Badge variant="outline" className="ml-2 text-xs">
              {departmentFilter}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-400">Working</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{workingCount}</p>
            <p className="text-xs text-green-400/70">
              {totalEquipment > 0 ? Math.round((workingCount / totalEquipment) * 100) : 0}%
            </p>
          </div>

          <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-400">Standby</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{standbyCount}</p>
            <p className="text-xs text-yellow-400/70">
              {totalEquipment > 0 ? Math.round((standbyCount / totalEquipment) * 100) : 0}%
            </p>
          </div>

          <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-red-400">Breakdown</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{breakdownCount}</p>
            <p className="text-xs text-red-400/70">
              {totalEquipment > 0 ? Math.round((breakdownCount / totalEquipment) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Equipment List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="mx-auto h-12 w-12 text-secondary-500 mb-4" />
              <h3 className="text-lg font-semibold text-secondary-400 mb-2">
                No Equipment Data
              </h3>
              <p className="text-secondary-400">
                No equipment status information available.
              </p>
            </div>
          ) : (
            data.map((equipment) => (
              <div
                key={equipment.id}
                className="flex items-center justify-between p-3 bg-secondary-700/50 rounded-lg hover:bg-secondary-700/70 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getStatusIcon(equipment.status)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-secondary-200 truncate">
                      {equipment.equipmentName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-secondary-400">
                        {equipment.equipmentCode}
                      </p>
                      <span className="text-xs text-secondary-500">•</span>
                      <p className="text-xs text-secondary-400">
                        {equipment.category}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getStatusColor(equipment.status)}`}>
                    {getStatusLabel(equipment.status)}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>

        {data.length > 0 && (
          <div className="pt-4 border-t border-secondary-600">
            <p className="text-xs text-secondary-400 text-center">
              Total {totalEquipment} equipment
              {departmentFilter && ` in ${departmentFilter}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
