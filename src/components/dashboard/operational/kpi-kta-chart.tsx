"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartData {
  rencana: number;
  aktual: number;
}

interface KpiKtaChartProps {
  kpiData?: ChartData;
  ktaData?: ChartData;
  department: string;
  currentMonth: string;
  isLoading?: boolean;
}

interface BarChartItem {
  category: string;
  value: number;
}

export function KpiKtaChart({ 
  kpiData, 
  ktaData,
  department, 
  currentMonth,
  isLoading = false
}: KpiKtaChartProps): React.JSX.Element {
  // Provide default values if data is undefined
  const safeKpiData: ChartData = kpiData || { rencana: 186, aktual: 0 };
  const safeKtaData: ChartData = ktaData || { rencana: 186, aktual: 0 };
  
  // Determine which data to show (prefer KTA for operational departments, KPI for MTCENG)
  const isDepartmentOperational = ['ECDC', 'HETU', 'MMTC', 'PMTC'].includes(department);
  const displayData = isDepartmentOperational ? safeKtaData : safeKpiData;
  const title = isDepartmentOperational ? 'KTA & TTA' : 'KPI Utama';
  
  // Transform data untuk chart
  const chartData: BarChartItem[] = [
    { category: 'Rencana', value: displayData.rencana },
    { category: 'Aktual', value: displayData.aktual }
  ];

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      color: string;
      dataKey: string;
      value: number;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-yellow-400 rounded p-3 shadow-lg">
          <p className="text-yellow-400 font-semibold mb-2">{label}</p>
          <p style={{ color: payload[0].color }} className="text-sm">
            Jumlah: {payload[0].value}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {payload[0].value === displayData.rencana 
              ? 'Target Bulanan' 
              : 'Data Tercatat'}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-secondary-900 to-secondary-800 border-primary-400/30">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-yellow-400 text-center">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-2"></div>
            <p className="text-sm text-gray-400">Memuat data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-secondary-900 to-secondary-800 border-primary-400/30">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-yellow-400 text-center">
          {title}
        </CardTitle>
        <p className="text-sm text-gray-400 text-center">
          Data bulan {currentMonth} - Perbandingan rencana vs aktual {department}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{
                top: 10,
                right: 30,
                left: 60,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                type="number" 
                domain={[0, 'dataMax + 20']}
                stroke="#fbbf24"
                fontSize={10}
              />
              <YAxis 
                type="category" 
                dataKey="category" 
                width={60}
                stroke="#fbbf24"
                fontSize={10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[0, 4, 4, 0]}
              >
                {chartData.map((entry: BarChartItem, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.category === 'Rencana' ? '#3b82f6' : '#10b981'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-center mt-3 space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded"></div>
            <span className="text-xs text-gray-300">Rencana ({displayData.rencana})</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded"></div>
            <span className="text-xs text-gray-300">Aktual ({displayData.aktual})</span>
          </div>
        </div>
        
        {/* Summary Card */}
        <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700 mt-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total {title}</p>
          <p className="text-xl font-bold text-green-400">{displayData.aktual}</p>
          <p className="text-xs text-gray-500">dari {displayData.rencana} target</p>
          <div className="mt-2">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${displayData.rencana > 0 ? Math.min((displayData.aktual / displayData.rencana) * 100, 100) : 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {displayData.rencana > 0 ? Math.round((displayData.aktual / displayData.rencana) * 100) : 0}% tercapai
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}