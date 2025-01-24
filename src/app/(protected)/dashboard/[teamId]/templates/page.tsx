import DashboardPageLayout from "@/features/dashboard/layout/page-layout";
import TemplatesTable from "@/features/dashboard/templates/table";
import { Suspense } from "react";

export default function Page() {
  return (
    <DashboardPageLayout title="Templates" fullscreen>
      <Suspense>
        <TemplatesTable />
      </Suspense>
    </DashboardPageLayout>
  );
}
