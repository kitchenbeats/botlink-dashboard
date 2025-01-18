import DashboardPageLayout from "@/components/dashboard/dashboard-page-layout";
import TemplatesTable from "@/components/dashboard/templates/templates-table";

export default function Page() {
  return (
    <DashboardPageLayout
      title="Templates"
      description="View and manage your templates."
    >
      <TemplatesTable />
    </DashboardPageLayout>
  );
}
