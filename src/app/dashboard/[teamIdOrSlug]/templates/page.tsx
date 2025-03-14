import DashboardPageLayout from '@/features/dashboard/page-layout'
import TemplatesTable from '@/features/dashboard/templates/table'
import {
  getDefaultTemplates,
  getTeamTemplates,
} from '@/server/templates/get-team-templates'
import { Suspense } from 'react'
import LoadingLayout from '../../loading'
import ErrorBoundary from '@/ui/error'
import {
  bailOutFromPPR,
  resolveTeamIdInServerComponent,
} from '@/lib/utils/server'

interface PageProps {
  params: Promise<{
    teamIdOrSlug: string
  }>
}

export default async function Page({ params }: PageProps) {
  const { teamIdOrSlug } = await params

  return (
    <DashboardPageLayout title="Templates" fullscreen>
      <Suspense fallback={<LoadingLayout />}>
        <PageContent teamIdOrSlug={teamIdOrSlug} />
      </Suspense>
    </DashboardPageLayout>
  )
}

interface PageContentProps {
  teamIdOrSlug: string
}

async function PageContent({ teamIdOrSlug }: PageContentProps) {
  bailOutFromPPR()

  const teamId = await resolveTeamIdInServerComponent(teamIdOrSlug)

  const res = await getTeamTemplates({
    teamId,
  })

  const defaultRes = await getDefaultTemplates()

  if (res.type === 'error') {
    return (
      <ErrorBoundary
        error={
          {
            name: 'Templates Error',
            message: res.message,
          } satisfies Error
        }
        description={'Could not load templates'}
      />
    )
  }

  const templates = [
    ...res.data,
    ...(defaultRes.type === 'success' ? defaultRes.data : []),
  ]

  return <TemplatesTable templates={templates} />
}
