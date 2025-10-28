import CreditsCard from '@/features/dashboard/budget/credits-card'
import UsageLimits from '@/features/dashboard/budget/usage-limits'
import { resolveTeamIdInServerComponent, bailOutFromPPR } from '@/lib/utils/server'
import Frame from '@/ui/frame'
import { PageSkeleton } from '@/ui/loading-skeletons'
import { Suspense } from 'react'

interface BudgetPageProps {
  params: Promise<{ teamIdOrSlug: string }>
}

async function BudgetPageContent({ params }: BudgetPageProps) {
  bailOutFromPPR()

  const { teamIdOrSlug } = await params
  const teamId = await resolveTeamIdInServerComponent(teamIdOrSlug)

  return (
    <Frame
      classNames={{
        frame: 'flex flex-col gap-4 max-md:border-none',
        wrapper: 'w-full max-md:p-0',
      }}
    >
      <CreditsCard teamId={teamId} />
      <UsageLimits teamId={teamId} />
    </Frame>
  )
}

export default function BudgetPage({ params }: BudgetPageProps) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BudgetPageContent params={params} />
    </Suspense>
  )
}
