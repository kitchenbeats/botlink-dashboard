import DashboardPageLayout from '@/features/dashboard/page-layout'
import { Suspense } from 'react'
import { resolveTeamIdInServerComponent } from '@/lib/utils/server'
import { NameCard } from '@/features/dashboard/team/name-card'
import { EmailCard } from '@/features/dashboard/team/email-card'
import { MemberCard } from '@/features/dashboard/team/member-card'

interface GeneralPageProps {
  params: Promise<{
    teamIdOrSlug: string
  }>
}

export default async function GeneralPage({ params }: GeneralPageProps) {
  const { teamIdOrSlug } = await params
  const teamId = await resolveTeamIdInServerComponent(teamIdOrSlug)

  return (
    <DashboardPageLayout title="General">
      <div className="grid w-full grid-cols-12">
        <Suspense>
          <>
            <NameCard className="col-span-12 max-md:border-b md:col-span-6 md:border-r" />
            <EmailCard className="col-span-12 md:col-span-6" />
          </>
        </Suspense>

        <section className="col-span-full border-t">
          <MemberCard teamId={teamId} className="" />
        </section>
      </div>
    </DashboardPageLayout>
  )
}
