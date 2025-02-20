import DashboardPageLayout from '@/features/dashboard/page-layout'
import { TeamSettingsForm } from '@/features/dashboard/team/settings-form'
import AddMemberForm from '@/features/dashboard/team/add-member-form'
import { Suspense } from 'react'
import MemberTable from '@/features/dashboard/team/member-table'
import { CardDescription } from '@/ui/primitives/card'
import { CardTitle } from '@/ui/primitives/card'
import { resolveTeamIdInServerComponent } from '@/lib/utils/server'

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
      <div className="grid w-full gap-8 p-6">
        <Suspense fallback={null}>
          <TeamSettingsForm />
        </Suspense>

        <section className="grid gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>Members</CardTitle>
            <CardDescription>Manage your organization members</CardDescription>
          </div>

          <div className="grid gap-8">
            <Suspense fallback={null}>
              <AddMemberForm className="w-full max-w-[24rem]" />
            </Suspense>
            <div className="bg-card w-full overflow-x-auto">
              <MemberTable teamId={teamId} />
            </div>
          </div>
        </section>
      </div>
    </DashboardPageLayout>
  )
}
