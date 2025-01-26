import BillingPageClient from "./page-client";
import DashboardPageLayout from "@/features/dashboard/layout/page-layout";

export default function BillingPage() {
  return (
    <DashboardPageLayout title="Billing">
      <BillingPageClient />
    </DashboardPageLayout>
  );
}
