"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ApprovalRequestsTable } from "./approval-requests-table";
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";

interface ApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface ApprovalRequest {
  id: number;
  requesterId: number;
  approverId?: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestType: string;
  tableName: string;
  recordId?: number;
  oldData?: Record<string, unknown>;
  newData: Record<string, unknown>;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  requester: {
    id: number;
    username: string;
    role: string;
  };
  approver?: {
    id: number;
    username: string;
    role: string;
  };
}

export function ApprovalsClient() {
  const [stats, setStats] = useState<ApprovalStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadApprovalRequests();
  }, []);

  const loadApprovalRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/approvals");

      if (response.ok) {
        const result = await response.json();
        setStats(
          result.stats || {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
          }
        );
        setApprovalRequests(result.data || []);
        setMessage(null);
      } else {
        const error = await response.json();
        console.error("Failed to load approval requests:", error);
        setMessage({
          type: "error",
          text: error.error || "Gagal memuat data approval requests",
        });
      }
    } catch (error) {
      console.error("Error loading approval requests:", error);
      setMessage({
        type: "error",
        text: "Error saat memuat data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovalAction = async (id: number, status: "APPROVED" | "REJECTED") => {
    try {
      const response = await fetch(`/api/approvals/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({
          type: "success",
          text: result.message,
        });
        // Reload data
        loadApprovalRequests();
      } else {
        const error = await response.json();
        setMessage({
          type: "error",
          text: error.error || "Gagal memproses approval",
        });
      }
    } catch (error) {
      console.error("Error processing approval:", error);
      setMessage({
        type: "error",
        text: "Error saat memproses approval",
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Messages */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Persetujuan</h1>
        <p className="text-muted-foreground">
          Kelola permintaan persetujuan perubahan data dari pengguna
        </p>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Semua request</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pending}
            </div>
            <p className="text-xs text-muted-foreground">Menunggu approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
            <p className="text-xs text-muted-foreground">Telah disetujui</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.rejected}
            </div>
            <p className="text-xs text-muted-foreground">Ditolak</p>
          </CardContent>
        </Card>
      </div>

      {/* Approval Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Permintaan Persetujuan</CardTitle>
          <CardDescription>
            Kelola semua permintaan persetujuan perubahan data sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton 
              columns={6}
              rows={6}
              showSearch={true}
              showFilters={true}
              showPagination={true}
            />
          ) : approvalRequests.length > 0 ? (
            <ApprovalRequestsTable
              approvalRequests={approvalRequests}
              onApprovalAction={handleApprovalAction}
              isLoading={false}
            />
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Belum Ada Permintaan Approval
              </h3>
              <p className="text-muted-foreground">
                Permintaan persetujuan akan muncul di sini ketika ada perubahan data yang membutuhkan approval
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
