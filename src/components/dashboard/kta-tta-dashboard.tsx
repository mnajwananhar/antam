"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, Filter, TrendingUp, Target } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface KtaTtaData {
  month: string;
  rencana: number;
  aktual: number;
  percentage: number;
}

interface KtaTtaStats {
  totalRows: number;
  targetRencana: number;
  achievement: number;
  status: "on-track" | "behind" | "exceeded";
}

export function KtaTtaDashboard(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [data, setData] = useState<KtaTtaData[]>([]);
  const [stats, setStats] = useState<KtaTtaStats>({
    totalRows: 0,
    targetRencana: 186,
    achievement: 0,
    status: "on-track"
  });

  const loadKtaTtaData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Fetch current month data
      const response = await fetch(`/api/kta-tta?month=${selectedMonth}&department=MTC ENG`);
      if (!response.ok) throw new Error("Failed to fetch data");
      
      const result = await response.json();
      const currentMonthData = result.data || [];
      
      // Calculate stats
      const totalRows = currentMonthData.length;
      const achievement = Math.round((totalRows / stats.targetRencana) * 100);
      const status: "on-track" | "behind" | "exceeded" = 
        achievement >= 100 ? "exceeded" : 
        achievement >= 80 ? "on-track" : "behind";
      
      setStats({
        totalRows,
        targetRencana: 186,
        achievement,
        status
      });
      
      // Prepare chart data
      const chartData: KtaTtaData[] = [
        {
          month: "MTC ENG",
          rencana: 186,
          aktual: totalRows,
          percentage: achievement
        }
      ];
      
      setData(chartData);
    } catch (error) {
      console.error("Error loading KTA/TTA data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKtaTtaData();
  }, [selectedMonth]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "exceeded": return "text-green-600";
      case "on-track": return "text-yellow-600";
      case "behind": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getStatusBadge = (status: string): React.JSX.Element => {
    const variants = {
      "exceeded": "default",
      "on-track": "secondary", 
      "behind": "destructive"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status === "exceeded" ? "Melebihi Target" : 
         status === "on-track" ? "Sesuai Target" : "Di Bawah Target"}
      </Badge>
    );
  };

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
        <Button variant="outline" size="sm" onClick={loadKtaTtaData}>
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
                <p className="text-sm font-medium text-muted-foreground">Total Rows</p>
                <p className="text-2xl font-bold">{stats.totalRows}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Target Rencana</p>
                <p className="text-2xl font-bold">{stats.targetRencana}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Achievement</p>
                <p className={`text-2xl font-bold ${getStatusColor(stats.status)}`}>
                  {stats.achievement}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="mt-1">
                  {getStatusBadge(stats.status)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pelaporan KTA/TTA ANTAM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
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
                    name === 'rencana' ? 'Sum of Rencana' : 'Sum of Aktual'
                  ]}
                />
                <Bar dataKey="rencana" fill="#dc2626" name="rencana" />
                <Bar dataKey="aktual" fill="#2563eb" name="aktual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Achievement Badge */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded" />
              <span className="text-sm text-muted-foreground">Sum of Rencana</span>
              <div className="w-3 h-3 bg-blue-600 rounded ml-4" />
              <span className="text-sm text-muted-foreground">Sum of Aktual</span>
            </div>
            <Badge 
              variant={stats.achievement >= 100 ? "default" : "secondary"}
              className="text-sm"
            >
              {stats.achievement}%
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}