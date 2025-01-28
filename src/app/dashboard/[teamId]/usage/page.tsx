import DashboardPageLayout from "@/features/dashboard/page-layout";
import UsageCharts from "@/features/dashboard/usage/charts";

export default async function UsagePage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <DashboardPageLayout title="Usage">
      <UsageCharts teamId={teamId} />
    </DashboardPageLayout>
  );
}
