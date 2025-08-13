"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { MtcEngDashboard } from "@/components/dashboard/mtceng";

export default function MtcEngBurauDashboardPage(): React.JSX.Element {
  return (
    <AppLayout>
      <MtcEngDashboard />
    </AppLayout>
  );
}