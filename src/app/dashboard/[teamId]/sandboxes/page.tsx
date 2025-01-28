import DashboardPageLayout from "@/features/dashboard/layout/page-layout";
import SandboxesTable from "@/features/dashboard/sandboxes/table";

export default function Page() {
  return (
    <DashboardPageLayout title="Running Sandboxes" fullscreen>
      <SandboxesTable />
    </DashboardPageLayout>
  );
}
