"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { ManageDataClient } from "@/components/manage-data/manage-data-client";

export default function ManageDataPage(): React.JSX.Element {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Only authenticated users can access this page
  if (!["ADMIN", "PLANNER", "INPUTTER"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <AppLayout>
      <ManageDataClient />
    </AppLayout>
  );
}
