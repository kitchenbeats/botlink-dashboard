import DashboardPageLayout from "@/features/dashboard/layout/page-layout";
import TemplatesTable from "@/features/dashboard/templates/table";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <DashboardPageLayout title="Templates" fullscreen>
        <TemplatesTable />
      </DashboardPageLayout>
    </Suspense>
  );
}
