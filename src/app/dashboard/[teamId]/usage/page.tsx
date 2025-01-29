import DashboardPageLayout from "@/features/dashboard/page-layout";
import { CostCard } from "@/features/dashboard/usage/cost-card";
import { RAMCard } from "@/features/dashboard/usage/ram-card";
import UsageLimits from "@/features/dashboard/usage/usage-limits";
import { VCPUCard } from "@/features/dashboard/usage/vcpu-card";

export default async function UsagePage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <DashboardPageLayout
      title="Usage"
      fullscreen
      className="flex flex-col justify-end"
    >
      <UsageLimits teamId={teamId} className="h-full w-full" />
      <div className="grid w-full grid-cols-12 self-end border-t">
        <CostCard teamId={teamId} className="col-span-12 border-b border-r" />
        <VCPUCard teamId={teamId} className="col-span-6 border-r" />
        <RAMCard teamId={teamId} className="col-span-6" />
      </div>
    </DashboardPageLayout>
  );
}
