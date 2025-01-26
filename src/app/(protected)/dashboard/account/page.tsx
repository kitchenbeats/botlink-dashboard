import DashboardPageLayout from "@/features/dashboard/layout/page-layout";
import PageClient from "./page-client";

export default function AccountPage() {
  return (
    <DashboardPageLayout title="Account">
      <PageClient />
    </DashboardPageLayout>
  );
}
