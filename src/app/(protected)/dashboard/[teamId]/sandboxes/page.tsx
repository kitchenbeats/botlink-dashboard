import DashboardPageLayout from "@/features/dashboard/layout/page-layout";
import SandboxesTable from "@/features/dashboard/sandboxes/table";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <DashboardPageLayout title="Running Sandboxes" fullscreen>
        <SandboxesTable />
      </DashboardPageLayout>
    </Suspense>
  );
}
