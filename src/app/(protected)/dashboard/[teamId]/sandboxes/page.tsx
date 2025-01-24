import DashboardPageLayout from "@/features/dashboard/layout/page-layout";
import SandboxesTable from "@/features/dashboard/sandboxes/table";
import { Suspense } from "react";

export default function Page() {
  return (
    <DashboardPageLayout title="Running Sandboxes" fullscreen>
      <Suspense>
        <SandboxesTable />
      </Suspense>
    </DashboardPageLayout>
  );
}
