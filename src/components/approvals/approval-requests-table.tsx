"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  Calendar,
} from "lucide-react";
import { dateUtils } from "@/lib/utils";

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

interface ApprovalRequestsTableProps {
  approvalRequests: ApprovalRequest[];
  onApprovalAction: (id: number, status: "APPROVED" | "REJECTED") => Promise<void>;
  isLoading: boolean;
}

export function ApprovalRequestsTable({
  approvalRequests,
  onApprovalAction,
  isLoading
}: ApprovalRequestsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [processingAction, setProcessingAction] = useState(false);

  // Filter requests based on search and status
  const filteredRequests = approvalRequests.filter((request) => {
    const matchesSearch = 
      request.requester.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRequestTypeDisplay = (requestType: string) => {
    const types: { [key: string]: string } = {
      "data_change": "Perubahan Data",
      "data_deletion": "Penghapusan Data",
    };
    return types[requestType] || requestType;
  };

  const handleViewDetails = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setShowDetailDialog(true);
  };

  const handleApprovalAction = (request: ApprovalRequest, action: "APPROVED" | "REJECTED") => {
    setSelectedRequest(request);
    setActionType(action);
    setShowActionDialog(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest) return;
    
    setProcessingAction(true);
    try {
      await onApprovalAction(selectedRequest.id, actionType);
      setShowActionDialog(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error("Error processing approval:", error);
    } finally {
      setProcessingAction(false);
    }
  };

  const canTakeAction = (request: ApprovalRequest) => {
    return request.status === "PENDING";
  };

  const renderDataPreview = (data: Record<string, unknown>) => {
    return (
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex items-start gap-3">
            <div className="font-medium text-sm text-muted-foreground min-w-0 flex-shrink-0 w-32">
              {formatFieldName(key)}:
            </div>
            <div className="text-sm flex-1 min-w-0">
              {formatFieldValue(value)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const formatFieldName = (fieldName: string) => {
    // Convert camelCase/snake_case to readable format
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatFieldValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Ya' : 'Tidak';
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString('id-ID');
    }
    
    if (typeof value === 'string') {
      // Check if it's a date string
      if (value.match(/^\d{4}-\d{2}-\d{2}/) || value.includes('T')) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return dateUtils.formatDateTime(value);
          }
        } catch {
          // Not a valid date, return as string
        }
      }
      return value;
    }
    
    if (typeof value === 'object') {
      // For nested objects or arrays, show a simplified preview
      if (Array.isArray(value)) {
        return `Array (${value.length} items)`;
      }
      return `Object (${Object.keys(value).length} properties)`;
    }
    
    return String(value);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cari berdasarkan username atau tipe request..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Menampilkan {filteredRequests.length} dari {approvalRequests.length} permintaan
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Pemohon</TableHead>
                <TableHead>Tipe Request</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approver</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm || statusFilter !== "all" 
                      ? "Tidak ada permintaan yang sesuai dengan filter"
                      : "Belum ada permintaan approval"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {dateUtils.formatDateTime(request.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.requester.username}</div>
                        <div className="text-xs text-muted-foreground">
                          {request.requester.role}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline">
                        {getRequestTypeDisplay(request.requestType)}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    
                    <TableCell>
                      {request.status !== "PENDING" && request.approver ? (
                        <div>
                          <div className="font-medium text-sm">{request.approver.username}</div>
                          <div className="text-xs text-muted-foreground">
                            {request.approvedAt && dateUtils.formatDateTime(request.approvedAt)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(request)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {canTakeAction(request) && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprovalAction(request, "APPROVED")}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              disabled={isLoading}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprovalAction(request, "REJECTED")}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={isLoading}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Permintaan Approval</DialogTitle>
            <DialogDescription>
              Informasi lengkap tentang permintaan perubahan data
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Pemohon</Label>
                  <p className="text-sm">{selectedRequest.requester.username} ({selectedRequest.requester.role})</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tanggal Request</Label>
                  <p className="text-sm">{dateUtils.formatDateTime(selectedRequest.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tipe Request</Label>
                  <p className="text-sm">{getRequestTypeDisplay(selectedRequest.requestType)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tabel</Label>
                  <p className="text-sm font-mono">{selectedRequest.tableName}</p>
                </div>
              </div>


              {selectedRequest.oldData && (
                <div>
                  <Label className="text-sm font-medium">Data Lama</Label>
                  <div className="bg-muted p-3 rounded max-h-32 overflow-auto">
                    {renderDataPreview(selectedRequest.oldData)}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Data Baru</Label>
                <div className="bg-muted p-3 rounded max-h-32 overflow-auto">
                  {renderDataPreview(selectedRequest.newData)}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>

              {selectedRequest.status !== "PENDING" && selectedRequest.approver && (
                <div>
                  <Label className="text-sm font-medium">
                    {selectedRequest.status === "APPROVED" ? "Disetujui oleh" : "Ditolak oleh"}
                  </Label>
                  <p className="text-sm">
                    {selectedRequest.approver.username} pada {selectedRequest.approvedAt && dateUtils.formatDateTime(selectedRequest.approvedAt)}
                  </p>
                </div>
              )}

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "APPROVED" ? "Setujui" : "Tolak"} Permintaan
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin {actionType === "APPROVED" ? "menyetujui" : "menolak"} permintaan ini?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowActionDialog(false)}
              disabled={processingAction}
            >
              Batal
            </Button>
            <Button
              variant={actionType === "APPROVED" ? "default" : "destructive"}
              onClick={confirmAction}
              disabled={processingAction}
            >
              {processingAction ? "Processing..." : 
               actionType === "APPROVED" ? "Setujui" : "Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}