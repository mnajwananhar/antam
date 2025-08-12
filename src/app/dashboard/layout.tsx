import type { Metadata } from "next";
import { AppLayout } from "@/components/layout/app-layout";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard utama sistem informasi operasional ANTAM",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps): React.JSX.Element {
  return (
    <AppLayout>
      <div className="h-full bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900 dark:to-secondary-800">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {children}
        </div>
      </div>
    </AppLayout>
  );
}