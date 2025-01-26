import DashboardPageLayout from "@/features/dashboard/layout/page-layout";
import UsagePageClient from "./page-client";

export default function UsagePage() {
  return (
    <DashboardPageLayout title="Usage">
      <UsagePageClient />
    </DashboardPageLayout>
  );
}
