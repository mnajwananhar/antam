"use client";

import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SafetyIncidentsChartProps {
  data: Array<{
    month: string;
    nearmiss: number;
    kecAlat: number;
    kecKecil: number;
    kecRingan: number;
    kecBerat: number;
    fatality: number;
  }>;
  chartType?: "stacked" | "grouped" | "line";
}

export function SafetyIncidentsChart({ data, chartType = "stacked" }: SafetyIncidentsChartProps): React.JSX.Element {
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
      const total = payload.reduce((sum: number, entry) => sum + entry.value, 0);
      return (
        <div className="bg-gray-900 border border-yellow-400 rounded p-3 shadow-lg">
          <p className="text-yellow-400 font-semibold mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.dataKey === "nearmiss" && "Nearmiss: "}
              {entry.dataKey === "kecAlat" && "Kec. Alat: "}
              {entry.dataKey === "kecKecil" && "Kec. Kecil: "}
              {entry.dataKey === "kecRingan" && "Kec. Ringan: "}
              {entry.dataKey === "kecBerat" && "Kec. Berat: "}
              {entry.dataKey === "fatality" && "Fatality: "}
              {entry.value}
            </p>
          ))}
          <div className="border-t border-gray-600 mt-2 pt-2">
            <p className="text-yellow-400 text-sm font-semibold">Total: {total}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = () => {
    const legendItems = [
      { value: "nearmiss", color: "#3b82f6", label: "Nearmiss" },
      { value: "kecAlat", color: "#dc2626", label: "Kec Alat" },
      { value: "kecKecil", color: "#84cc16", label: "Kec Kecil" },
      { value: "kecRingan", color: "#7c3aed", label: "Kec Ringan" },
      { value: "kecBerat", color: "#06b6d4", label: "Kec. Berat" },
      { value: "fatality", color: "#f59e0b", label: "Fatality" },
    ];

    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {legendItems.map((item) => (
          <div key={item.value} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-300">{item.label}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    const chartElements = [
      { dataKey: "nearmiss", fill: "#3b82f6", stroke: "#3b82f6" },
      { dataKey: "kecAlat", fill: "#dc2626", stroke: "#dc2626" },
      { dataKey: "kecKecil", fill: "#84cc16", stroke: "#84cc16" },
      { dataKey: "kecRingan", fill: "#7c3aed", stroke: "#7c3aed" },
      { dataKey: "kecBerat", fill: "#06b6d4", stroke: "#06b6d4" },
      { dataKey: "fatality", fill: "#f59e0b", stroke: "#f59e0b" },
    ];

    if (chartType === "line") {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="month" 
            stroke="#fbbf24"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#fbbf24"
            fontSize={12}
            label={{ 
              value: 'JUMLAH', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: '#fbbf24' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          {chartElements.map((element) => (
            <Line 
              key={element.dataKey}
              type="monotone" 
              dataKey={element.dataKey} 
              stroke={element.stroke}
              strokeWidth={2}
              dot={{ fill: element.stroke, strokeWidth: 2, r: 4 }}
            />
          ))}
        </LineChart>
      );
    }

    return (
      <BarChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="month" 
          stroke="#fbbf24"
          fontSize={12}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          stroke="#fbbf24"
          fontSize={12}
          label={{ 
            value: 'JUMLAH', 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle', fill: '#fbbf24' }
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        {chartElements.map((element) => (
          <Bar 
            key={element.dataKey}
            dataKey={element.dataKey} 
            stackId={chartType === "stacked" ? "incidents" : element.dataKey}
            fill={element.fill}
          />
        ))}
      </BarChart>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-secondary-900 to-secondary-800 border-primary-400/30">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-yellow-400 text-center">
          Safety Incidents Monthly Report ({chartType === "stacked" ? "Stacked" : chartType === "grouped" ? "Grouped" : "Line"} View)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
        
        <CustomLegend />
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-700">
          <div className="text-center">
            <p className="text-xl font-bold text-yellow-400">
              {data.reduce((sum, month) => sum + month.nearmiss + month.kecAlat + month.kecKecil + month.kecRingan + month.kecBerat + month.fatality, 0)}
            </p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total Incidents</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-blue-400">
              {data.reduce((sum, month) => sum + month.nearmiss, 0)}
            </p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Nearmiss Total</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-red-400">
              {data.reduce((sum, month) => sum + month.fatality, 0)}
            </p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Fatalities</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
