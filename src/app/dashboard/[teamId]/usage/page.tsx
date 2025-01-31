import DashboardPageLayout from "@/features/dashboard/page-layout";
import { CostCard } from "@/features/dashboard/usage/cost-card";
import { RAMCard } from "@/features/dashboard/usage/ram-card";
import UsageLimits from "@/features/dashboard/budget/usage-limits";
import { VCPUCard } from "@/features/dashboard/usage/vcpu-card";

export default async function UsagePage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <DashboardPageLayout title="Usage" className="flex flex-col justify-end">
      <div className="grid max-h-full w-full grid-cols-1 self-end overflow-y-auto lg:grid-cols-12">
        <CostCard
          teamId={teamId}
          className="col-span-1 min-h-[360px] border-b lg:col-span-12"
        />
        <VCPUCard
          teamId={teamId}
          className="col-span-1 min-h-[320px] border-b lg:col-span-6 lg:border-b-0 lg:border-r"
        />
        <RAMCard
          teamId={teamId}
          className="col-span-1 min-h-[320px] border-b lg:col-span-6 lg:border-b-0"
        />
      </div>
    </DashboardPageLayout>
  );
}
