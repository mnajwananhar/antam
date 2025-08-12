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
}

export function CriticalIssuesTable({ data }: CriticalIssuesTableProps): React.JSX.Element {
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

  return (
    <Card className="bg-gradient-to-br from-secondary-900 to-secondary-800 border-primary-400/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-yellow-400 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-black" />
          </div>
          <CardTitle className="text-lg font-semibold text-yellow-400">
            Critical Issue
          </CardTitle>
        </div>
        <Badge variant="outline" className="border-yellow-400 text-yellow-400">
          {data.length} Issues
        </Badge>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-secondary-500 mb-4" />
            <h3 className="text-lg font-semibold text-secondary-400 mb-2">
              No Critical Issues
            </h3>
            <p className="text-secondary-400">
              There are currently no critical issues reported.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-600">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-yellow-400">
                    Issue
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-yellow-400">
                    Dept
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-yellow-400">
                    Keterangan
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-yellow-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((issue) => (
                  <tr 
                    key={issue.id} 
                    className="border-b border-secondary-700 hover:bg-secondary-800/50 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium text-secondary-200 text-sm">
                          {issue.issueName}
                        </p>
                        <p className="text-xs text-secondary-400 mt-1">
                          {formatDistanceToNow(new Date(issue.createdAt), {
                            addSuffix: true,
                            locale: id,
                          })}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge 
                        variant="outline" 
                        className="text-xs border-blue-400 text-blue-400"
                      >
                        {issue.department}
                      </Badge>
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {data.length > 0 && (
          <div className="mt-4 pt-4 border-t border-secondary-600">
            <p className="text-xs text-secondary-400 text-center">
              Showing {data.length} most recent critical issues
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
