import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail Departemen",
  description: "Detail informasi departemen ANTAM",
};

interface DepartmentDetailLayoutProps {
  children: React.ReactNode;
}

export default function DepartmentDetailLayout({ children }: DepartmentDetailLayoutProps): React.JSX.Element {
  return (
    <div className="h-full bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900 dark:to-secondary-800">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {children}
      </div>
    </div>
  );
}