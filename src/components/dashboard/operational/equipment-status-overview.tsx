"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface EquipmentStatusData {
  id: number;
  name: string;
  code: string;
  category: string;
  status: "WORKING" | "STANDBY" | "BREAKDOWN";
  lastUpdated: string;
  updatedBy: string;
  notes?: string;
}

interface EquipmentStatusOverviewProps {
  data: EquipmentStatusData[];
  loading?: boolean;
}

export function EquipmentStatusOverview({ 
  data, 
  loading = false 
}: EquipmentStatusOverviewProps): React.JSX.Element {
  const statusStats = useMemo(() => {
    const stats = {
      WORKING: 0,
      STANDBY: 0,
      BREAKDOWN: 0,
      total: data.length,
    };

    data.forEach((equipment) => {
      stats[equipment.status]++;
    });

    return {
      ...stats,
      workingPercentage: stats.total > 0 ? (stats.WORKING / stats.total) * 100 : 0,
      standbyPercentage: stats.total > 0 ? (stats.STANDBY / stats.total) * 100 : 0,
      breakdownPercentage: stats.total > 0 ? (stats.BREAKDOWN / stats.total) * 100 : 0,
    };
  }, [data]);

  const getStatusIcon = (status: string): React.JSX.Element => {
    switch (status) {
      case "WORKING":
        return <CheckCircle className="h-4 w-4" />;
      case "STANDBY":
        return <Clock className="h-4 w-4" />;
      case "BREAKDOWN":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "WORKING":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "STANDBY":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "BREAKDOWN":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatLastUpdated = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-secondary-800/50 border-primary/30">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Equipment Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-16 bg-secondary-700 rounded-lg"></div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-12 bg-secondary-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-secondary-800/50 border-primary/30">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Equipment Status Overview
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-green-400 font-medium">Working</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {statusStats.WORKING}
              </div>
              <div className="text-sm text-green-400">
                {statusStats.workingPercentage.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                <span className="text-yellow-400 font-medium">Standby</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {statusStats.STANDBY}
              </div>
              <div className="text-sm text-yellow-400">
                {statusStats.standbyPercentage.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span className="text-red-400 font-medium">Breakdown</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {statusStats.BREAKDOWN}
              </div>
              <div className="text-sm text-red-400">
                {statusStats.breakdownPercentage.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Equipment List */}
        {data.length === 0 ? (
          <div className="text-center py-8">
            <Settings className="h-12 w-12 text-secondary-500 mx-auto mb-4" />
            <p className="text-secondary-400">No equipment data available</p>
            <p className="text-sm text-secondary-500">
              Equipment status will appear once data is available
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.map((equipment) => (
              <div
                key={equipment.id}
                className="flex items-center justify-between p-3 bg-secondary-700/50 rounded-lg hover:bg-secondary-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(equipment.status)}
                    <div>
                      <div className="font-medium text-white">
                        {equipment.name}
                      </div>
                      <div className="text-sm text-secondary-400">
                        {equipment.code} • {equipment.category}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm text-secondary-400">
                      {formatLastUpdated(equipment.lastUpdated)}
                    </div>
                    <div className="text-xs text-secondary-500">
                      by {equipment.updatedBy}
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(equipment.status)} border`}
                  >
                    {equipment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t border-secondary-600">
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary-400">
              Total Equipment: {statusStats.total}
            </span>
            <span className="text-secondary-400">
              Operational Rate: {statusStats.workingPercentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}