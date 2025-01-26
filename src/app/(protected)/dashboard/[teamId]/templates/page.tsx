import DashboardPageLayout from "@/features/dashboard/layout/page-layout";
import TemplatesTable from "@/features/dashboard/templates/table";

export default function Page() {
  return (
    <DashboardPageLayout title="Templates" fullscreen>
      <TemplatesTable />
    </DashboardPageLayout>
  );
}
