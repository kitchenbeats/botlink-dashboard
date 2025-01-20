import DashboardPageLayout from "@/components/dashboard/dashboard-page-layout";
import TemplatesTable from "@/components/dashboard/templates/templates-table";
import { Suspense } from "react";

export default function Page() {
  return (
    <DashboardPageLayout title="Templates">
      <Suspense>
        <TemplatesTable />
      </Suspense>
    </DashboardPageLayout>
  );
}
