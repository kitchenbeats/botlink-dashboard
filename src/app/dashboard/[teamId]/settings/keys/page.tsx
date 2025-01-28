import KeysPageClient from "./page-client";
import DashboardPageLayout from "@/features/dashboard/page-layout";

export default function KeysPage() {
  return (
    <DashboardPageLayout title="API Keys">
      <KeysPageClient />
    </DashboardPageLayout>
  );
}
