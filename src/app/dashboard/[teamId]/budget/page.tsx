import DashboardPageLayout from "@/features/dashboard/page-layout";
import CreditsCard from "@/features/dashboard/budget/credits-card";
import UsageLimits from "@/features/dashboard/budget/usage-limits";

interface BudgetPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function BudgetPage({ params }: BudgetPageProps) {
  const { teamId } = await params;

  return (
    <DashboardPageLayout title="Budget" className="flex flex-col gap-4">
      <CreditsCard teamId={teamId} />
      <UsageLimits teamId={teamId} />
    </DashboardPageLayout>
  );
}
