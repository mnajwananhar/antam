import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppLayout } from "@/components/layout/app-layout";
import { ApprovalsClient } from "@/components/approvals/approvals-client";

export default async function ApprovalsPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  // Only Admin and Planner can access approvals page
  if (!["ADMIN", "PLANNER"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <AppLayout>
      <ApprovalsClient />
    </AppLayout>
  );
}
