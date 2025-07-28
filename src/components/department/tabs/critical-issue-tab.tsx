"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { EquipmentStatus } from "@prisma/client";

interface CriticalIssueTabProps {
  department: {
    id: number;
    name: string;
    code: string;
  };
  session: {
    user: {
      id: string;
      username: string;
      role: string;
    };
  };
}

interface CriticalIssue {
  id: number;
  issueName: string;
  status: EquipmentStatus;
  description: string;
  createdAt: string;
}

export function CriticalIssueTab({ department }: CriticalIssueTabProps) {
  const [issues] = useState<CriticalIssue[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newIssue, setNewIssue] = useState({
    issueName: "",
    status: EquipmentStatus.BREAKDOWN as EquipmentStatus,
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // API call would go here
      console.log("Submitting critical issue:", newIssue);

      // Reset form
      setNewIssue({
        issueName: "",
        status: EquipmentStatus.BREAKDOWN as EquipmentStatus,
        description: "",
      });
    } catch (error) {
      console.error("Error submitting critical issue:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: EquipmentStatus) => {
    const variants = {
      [EquipmentStatus.WORKING]: "default",
      [EquipmentStatus.STANDBY]: "secondary",
      [EquipmentStatus.BREAKDOWN]: "destructive",
    } as const;

    const icons = {
      [EquipmentStatus.WORKING]: <CheckCircle2 className="h-3 w-3" />,
      [EquipmentStatus.STANDBY]: <AlertTriangle className="h-3 w-3" />,
      [EquipmentStatus.BREAKDOWN]: <XCircle className="h-3 w-3" />,
    };

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {icons[status]}
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Form Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Laporan Critical Issue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nama Issue</label>
                <Input
                  value={newIssue.issueName}
                  onChange={(e) =>
                    setNewIssue((prev) => ({
                      ...prev,
                      issueName: e.target.value,
                    }))
                  }
                  placeholder="Masukkan nama critical issue"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={newIssue.status}
                  onValueChange={(value: EquipmentStatus) =>
                    setNewIssue((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EquipmentStatus.BREAKDOWN}>
                      Breakdown
                    </SelectItem>
                    <SelectItem value={EquipmentStatus.STANDBY}>
                      Standby
                    </SelectItem>
                    <SelectItem value={EquipmentStatus.WORKING}>
                      Working
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Deskripsi</label>
              <Textarea
                value={newIssue.description}
                onChange={(e) =>
                  setNewIssue((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Jelaskan detail critical issue..."
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                <Plus className="h-4 w-4 mr-2" />
                {isSubmitting ? "Menyimpan..." : "Simpan Critical Issue"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Issues List */}
      {issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {issues.map((issue) => (
                <div key={issue.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h4 className="font-medium">{issue.issueName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {issue.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(issue.createdAt).toLocaleString("id-ID")}
                      </p>
                    </div>
                    {getStatusBadge(issue.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
