
"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/table-skeleton";

interface Equipment {
  id: number;
  equipmentCode: string;
  equipmentName: string;
  category: string;
  status: string;
}

export default function EquipmentPage() {
  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/equipment");
        if (!response.ok) {
          throw new Error("Failed to fetch equipment data");
        }
        const data = await response.json();
        setEquipment(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Manajemen Peralatan
            </h1>
            <p className="text-muted-foreground">
              Kelola daftar peralatan yang digunakan di pabrik.
            </p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Daftar Peralatan</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton
                columns={5}
                rows={7}
                showSearch={true}
                showFilters={true}
                showPagination={true}
              />
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-2">Error: {error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="text-blue-600 underline"
                >
                  Try again
                </button>
              </div>
            ) : equipment.length > 0 ? (
              <div className="text-center py-8">
                <p className="text-green-600">
                  Found {equipment.length} equipment items (table implementation pending)
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No equipment data found. The equipment management feature is still in development.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
