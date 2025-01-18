import SandboxesTable from "@/components/dashboard/sandboxes/sandboxes-table";
import DashboardPageLayout from "@/components/dashboard/dashboard-page-layout";
import { Suspense } from "react";

export default function Page() {
  return (
    <DashboardPageLayout
      title="Sandboxes"
      description="View and manage your E2B Sandboxes."
    >
      <Suspense>
        <SandboxesTable />
      </Suspense>
    </DashboardPageLayout>
  );
}
