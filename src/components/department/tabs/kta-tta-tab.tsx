"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Session } from "next-auth";
import { useToastContext } from "@/lib/hooks";
import { Department } from "@prisma/client";
import { KtaKpiInputTable, type KtaKpiItem } from "@/components/kta-tta";
// ...existing code...

interface KtaTtaTabProps {
  department: Department;
  session: Session;
  editId?: number;
}

export function KtaTtaTab({ department }: KtaTtaTabProps): React.JSX.Element {
  const [existingData, setExistingData] = useState<KtaKpiItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const { showSuccess, showError } = useToastContext();

  const loadExistingData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      console.log(`Loading KTA-TTA data for department: ${department.code}`);
      const response = await fetch(
        `/api/kta-tta?department=${department.code}`
      );

      if (response.ok) {
        const result = await response.json();
        console.log(
          `Loaded filtered KTA-TTA data: ${
            result.data?.length || 0
          } records for ${department.code}`
        );
        setExistingData(result.data || []);
      } else {
        showError("Gagal memuat data KTA-TTA");
      }
    } catch {
      showError("Terjadi kesalahan saat memuat data");
    } finally {
      setIsLoadingData(false);
    }
  }, [department.code, showError]);

  // Load existing data with department PIC filtering
  useEffect(() => {
    loadExistingData();
  }, [loadExistingData]);

  // Status-only edit is handled by the table component directly

  const handleStatusChange = async (
    id: number,
    newStatus: "OPEN" | "CLOSE"
  ) => {
    try {
      const response = await fetch(`/api/kta-tta/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusTindakLanjut: newStatus }),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess(`Status berhasil diubah menjadi ${newStatus}`);

        // Update status in local state without API call
        setExistingData((prevData) =>
          prevData.map((item) =>
            item.id === id
              ? {
                  ...item,
                  statusTindakLanjut: newStatus,
                  updateStatus:
                    newStatus === "CLOSE"
                      ? "Close"
                      : item.dueDate && new Date(item.dueDate) < new Date()
                      ? "Due Date"
                      : "Proses",
                }
              : item
          )
        );
      } else {
        throw new Error(result.error || "Failed to update status");
      }
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Gagal mengubah status"
      );
      throw error; // Re-throw to handle in component
    }
  };

  const handleView = (item: KtaKpiItem) => {
    console.log("View item:", item);
  };

  return (
    <div className="space-y-6">
      {/* Data Table Only */}
      <KtaKpiInputTable
        data={existingData}
        dataType="KTA_TTA"
        isLoading={isLoadingData}
        onStatusChange={handleStatusChange}
        onView={handleView}
        maxHeight="600px"
      />
    </div>
  );
}
