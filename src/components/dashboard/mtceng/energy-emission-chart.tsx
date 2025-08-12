"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EnergyEmissionChartProps {
  data: Array<{
    month: string;
    emissionTarget: number | null;
    emissionRealization: number | null;
  }>;
  smoothLine?: boolean;
  comparisonMode?: "target_only" | "real_only" | "target_vs_real";
}

export function EnergyEmissionChart({ 
  data, 
  smoothLine = false, 
  comparisonMode = "target_vs_real" 
}: EnergyEmissionChartProps): React.JSX.Element {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-yellow-400 rounded p-3 shadow-lg">
          <p className="text-yellow-400 font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            // Skip null or invalid values
            if (entry.value === null || entry.value === undefined || entry.value < 0 || entry.value > 50000) {
              return null;
            }
            return (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {entry.dataKey === "emissionTarget" && "Target Emisi Tahun 2025: "}
                {entry.dataKey === "emissionRealization" && "Total Emission (tCO2e) 2025: "}
                {entry.value.toFixed(1)}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex justify-center gap-6 mt-4">
        {(comparisonMode === "target_only" || comparisonMode === "target_vs_real") && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500"></div>
            <span className="text-xs text-gray-300">Target Emisi Tahun 2025</span>
          </div>
        )}
        {(comparisonMode === "real_only" || comparisonMode === "target_vs_real") && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-yellow-500"></div>
            <span className="text-xs text-gray-300">Total Emission (tCO2e) 2025</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-yellow-400/20">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-yellow-400 text-center">
          Total Emission 2025 vs Baseline
          {comparisonMode === "target_only" && " - Target Only"}
          {comparisonMode === "real_only" && " - Realization Only"}
          {smoothLine && " (Smooth)"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
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
                domain={[0, 6000]}
              />
              <Tooltip content={<CustomTooltip />} />
              {(comparisonMode === "real_only" || comparisonMode === "target_vs_real") && (
                <Line 
                  type={smoothLine ? "monotone" : "linear"} 
                  dataKey="emissionRealization" 
                  stroke="#fbbf24" 
                  strokeWidth={3}
                  dot={{ fill: "#fbbf24", strokeWidth: 2, r: 4 }}
                  connectNulls={false}
                />
              )}
              {(comparisonMode === "target_only" || comparisonMode === "target_vs_real") && (
                <Line 
                  type={smoothLine ? "monotone" : "linear"} 
                  dataKey="emissionTarget" 
                  stroke="#dc2626" 
                  strokeWidth={3}
                  dot={{ fill: "#dc2626", strokeWidth: 2, r: 4 }}
                  connectNulls={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <CustomLegend />
        
        {/* Data Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 py-2">Month</th>
                {(comparisonMode === "real_only" || comparisonMode === "target_vs_real") && (
                  <th className="text-center text-gray-400 py-2">Total Emission</th>
                )}
                {(comparisonMode === "target_only" || comparisonMode === "target_vs_real") && (
                  <th className="text-center text-gray-400 py-2">Target Emission</th>
                )}
                {comparisonMode === "target_vs_real" && (
                  <th className="text-center text-gray-400 py-2">Variance</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => {
                const variance = (item.emissionRealization !== null && item.emissionTarget !== null && 
                                 item.emissionRealization > 0 && item.emissionTarget > 0 && 
                                 item.emissionRealization < 50000 && item.emissionTarget < 50000) 
                  ? item.emissionRealization - item.emissionTarget 
                  : null;
                return (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="text-yellow-400 py-1 font-medium">{item.month}-25</td>
                    {(comparisonMode === "real_only" || comparisonMode === "target_vs_real") && (
                      <td className="text-center text-yellow-400 py-1">
                        {(item.emissionRealization !== null && item.emissionRealization > 0 && item.emissionRealization < 50000) 
                          ? item.emissionRealization.toFixed(1) 
                          : "-"}
                      </td>
                    )}
                    {(comparisonMode === "target_only" || comparisonMode === "target_vs_real") && (
                      <td className="text-center text-red-400 py-1">
                        {(item.emissionTarget !== null && item.emissionTarget > 0 && item.emissionTarget < 50000) 
                          ? item.emissionTarget.toFixed(1) 
                          : "-"}
                      </td>
                    )}
                    {comparisonMode === "target_vs_real" && (
                      <td className={`text-center py-1 ${variance && variance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {variance !== null ? (variance > 0 ? '+' : '') + variance.toFixed(1) : "-"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
