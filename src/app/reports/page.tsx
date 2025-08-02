import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportsManagement } from "@/components/reports/reports-management";

export const metadata: Metadata = {
  title: "Laporan - ANTAM SIMBAPRO",
  description: "Manajemen dan review semua laporan operasional",
};

export default async function ReportsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Laporan Operasional
          </h1>
          <p className="text-muted-foreground">
            Kelola dan review semua laporan yang telah diinput
          </p>
        </div>
      </div>

      <ReportsManagement />
    </div>
  );
}
