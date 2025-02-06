import DashboardPageLayout from '@/features/dashboard/page-layout'
import { CostCard } from '@/features/dashboard/usage/cost-card'
import { RAMCard } from '@/features/dashboard/usage/ram-card'
import { VCPUCard } from '@/features/dashboard/usage/vcpu-card'
import { resolveTeamIdInServerComponent } from '@/lib/utils/server'

export default async function UsagePage({
  params,
}: {
  params: Promise<{ teamIdOrSlug: string }>
}) {
  const { teamIdOrSlug } = await params
  const teamId = await resolveTeamIdInServerComponent(teamIdOrSlug)

  return (
    <DashboardPageLayout
      title="Usage"
      className="grid max-h-full w-full grid-cols-1 self-end lg:grid-cols-12"
    >
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
    </DashboardPageLayout>
  )
}
