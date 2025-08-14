"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface CriticalIssue {
  id: number;
  issueName: string;
  department: string;
  status: string;
  description: string;
  createdAt: string;
}

interface CriticalIssuesTableProps {
  data: CriticalIssue[];
  isLoading?: boolean;
  departmentFilter?: string;
}

export function CriticalIssuesTable({ 
  data, 
  isLoading = false,
  departmentFilter 
}: CriticalIssuesTableProps): React.JSX.Element {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "INVESTIGASI":
        return "bg-blue-600 text-white";
      case "PROSES":
        return "bg-yellow-600 text-black";
      case "SELESAI":
        return "bg-green-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "INVESTIGASI":
        return "Investigasi";
      case "PROSES":
        return "Proses";
      case "SELESAI":
        return "Selesai";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-secondary-800/50 border-primary/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-black" />
            </div>
            <div className="animate-pulse bg-secondary-700 h-6 w-32 rounded"></div>
          </div>
          <div className="animate-pulse bg-secondary-700 h-6 w-20 rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-secondary-700 h-4 w-full rounded mb-2"></div>
                <div className="bg-secondary-700 h-3 w-3/4 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredData = departmentFilter 
    ? data.filter(issue => issue.department === departmentFilter)
    : data;

  return (
    <Card className="bg-secondary-800/50 border-primary/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-yellow-400 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-black" />
          </div>
          <CardTitle className="text-lg font-semibold text-yellow-400">
            Critical Issues
          </CardTitle>
        </div>
        <Badge variant="outline" className="border-yellow-400 text-yellow-400">
          {filteredData.length} {filteredData.length >= 10 ? '(Recent)' : ''} Issues
        </Badge>
      </CardHeader>
      <CardContent>
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-secondary-500 mb-4" />
            <h3 className="text-lg font-semibold text-secondary-400 mb-2">
              No Critical Issues
            </h3>
            <p className="text-secondary-400">
              {departmentFilter 
                ? `No critical issues found for ${departmentFilter} department.`
                : "There are currently no critical issues reported."
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-600">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-yellow-400">
                    Issue Name
                  </th>
                  {!departmentFilter && (
                    <th className="text-center py-3 px-2 text-sm font-semibold text-yellow-400">
                      Department
                    </th>
                  )}
                  <th className="text-left py-3 px-2 text-sm font-semibold text-yellow-400">
                    Description
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-yellow-400">
                    Status
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-yellow-400">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((issue) => (
                  <tr 
                    key={issue.id} 
                    className="border-b border-secondary-700 hover:bg-secondary-800/50 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <p className="font-medium text-secondary-200 text-sm">
                        {issue.issueName}
                      </p>
                    </td>
                    {!departmentFilter && (
                      <td className="py-3 px-2 text-center">
                        <Badge 
                          variant="outline" 
                          className="text-xs border-blue-400 text-blue-400"
                        >
                          {issue.department}
                        </Badge>
                      </td>
                    )}
                    <td className="py-3 px-2">
                      <p className="text-sm text-secondary-300 line-clamp-2 max-w-xs">
                        {issue.description}
                      </p>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge 
                        className={`text-xs ${getStatusColor(issue.status)}`}
                      >
                        {getStatusLabel(issue.status)}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <p className="text-xs text-secondary-400">
                        {formatDistanceToNow(new Date(issue.createdAt), {
                          addSuffix: true,
                          locale: id,
                        })}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {filteredData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-secondary-600">
            <p className="text-xs text-secondary-400 text-center">
              Showing {filteredData.length} critical issues
              {departmentFilter && ` for ${departmentFilter}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
