import DashboardPageLayout from "@/features/dashboard/page-layout";
import UsagePageClient from "./page-client";

export default function UsagePage() {
  return (
    <DashboardPageLayout title="Usage">
      <UsagePageClient />
    </DashboardPageLayout>
  );
}
