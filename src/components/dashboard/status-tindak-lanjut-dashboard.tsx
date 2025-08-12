"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, Filter, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface StatusStats {
  totalOpen: number;
  totalClose: number;
  totalItems: number;
  completionRate: number;
}

interface KtaKpiItem {
  id: number;
  statusTindakLanjut: "OPEN" | "CLOSE" | null;
}

export function StatusTindakLanjutDashboard(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [chartData, setChartData] = useState<StatusData[]>([]);
  const [stats, setStats] = useState<StatusStats>({
    totalOpen: 0,
    totalClose: 0,
    totalItems: 0,
    completionRate: 0
  });

  const loadStatusData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Fetch current month data
      const response = await fetch(`/api/kta-tta?month=${selectedMonth}&department=MTC ENG`);
      if (!response.ok) throw new Error("Failed to fetch data");
      
      const result = await response.json();
      const currentMonthData = result.data || [];
      
      // Calculate status counts
      const openCount = currentMonthData.filter((item: KtaKpiItem) => item.statusTindakLanjut === "OPEN").length;
      const closeCount = currentMonthData.filter((item: KtaKpiItem) => item.statusTindakLanjut === "CLOSE").length;
      const totalItems = currentMonthData.length;
      const completionRate = totalItems > 0 ? Math.round((closeCount / totalItems) * 100) : 0;
      
      setStats({
        totalOpen: openCount,
        totalClose: closeCount,
        totalItems,
        completionRate
      });
      
      // Prepare chart data
      const data: StatusData[] = [
        {
          name: "Open",
          value: openCount,
          color: "#f59e0b"
        },
        {
          name: "Close", 
          value: closeCount,
          color: "#10b981"
        }
      ];
      
      setChartData(data);
    } catch (error) {
      console.error("Error loading status data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatusData();
  }, [selectedMonth, loadStatusData]);

  const getCompletionStatus = (rate: number): { label: string; color: string } => {
    if (rate >= 80) return { label: "Excellent", color: "text-green-600" };
    if (rate >= 60) return { label: "Good", color: "text-yellow-600" };
    if (rate >= 40) return { label: "Fair", color: "text-orange-600" };
    return { label: "Needs Improvement", color: "text-red-600" };
  };

  const completionStatus = getCompletionStatus(stats.completionRate);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={format(new Date(), "yyyy-MM")}>
                {format(new Date(), "MMMM yyyy", { locale: id })}
              </SelectItem>
              <SelectItem value={format(new Date(new Date().setMonth(new Date().getMonth() - 1)), "yyyy-MM")}>
                {format(new Date(new Date().setMonth(new Date().getMonth() - 1)), "MMMM yyyy", { locale: id })}
              </SelectItem>
              <SelectItem value={format(new Date(new Date().setMonth(new Date().getMonth() - 2)), "yyyy-MM")}>
                {format(new Date(new Date().setMonth(new Date().getMonth() - 2)), "MMMM yyyy", { locale: id })}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={loadStatusData}>
          <Filter className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Open</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalOpen}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Close</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalClose}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className={`text-2xl font-bold ${completionStatus.color}`}>
                  {stats.completionRate}%
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="mt-1">
                  <Badge 
                    variant={stats.completionRate >= 80 ? "default" : 
                            stats.completionRate >= 60 ? "secondary" : "destructive"}
                  >
                    {completionStatus.label}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Tindak Lanjut ANTAM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#374151' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#374151' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      color: '#f9fafb'
                    }}
                    formatter={(value: number, name: string) => [
                      value,
                      `Sum of ${name}`
                    ]}
                  />
                  <Bar dataKey="value" name="Count">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded" />
                  <span className="text-sm text-muted-foreground">Sum of Open</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span className="text-sm text-muted-foreground">Sum of Close</span>
                </div>
              </div>
              <Badge 
                variant={stats.completionRate >= 70 ? "default" : "secondary"}
                className="text-sm"
              >
                {stats.completionRate >= 70 ? "34%" : "66%"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribusi Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      color: '#f9fafb'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Summary */}
            <div className="mt-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Total Items</p>
                <p className="text-3xl font-bold">{stats.totalItems}</p>
                <p className={`text-sm font-medium ${completionStatus.color}`}>
                  {completionStatus.label}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}