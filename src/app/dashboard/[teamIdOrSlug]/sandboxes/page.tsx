import LoadingLayout from '@/features/dashboard/loading-layout'
import DashboardPageLayout from '@/features/dashboard/page-layout'
import SandboxesTable from '@/features/dashboard/sandboxes/table'
import { getTeamSandboxes } from '@/server/sandboxes/get-team-sandboxes'
import { getTeamTemplates } from '@/server/templates/get-team-templates'
import { Suspense } from 'react'
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
    <DashboardPageLayout title="Active Sandboxes" fullscreen>
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

  const [sandboxesRes, templatesRes] = await Promise.all([
    getTeamSandboxes({ teamId }),
    getTeamTemplates({ teamId }),
  ])

  if (sandboxesRes.type === 'error') {
    return (
      <ErrorBoundary
        error={
          {
            name: 'Sandboxes Error',
            message: sandboxesRes.message,
          } satisfies Error
        }
        description={'Could not load sandboxes'}
      />
    )
  }

  if (templatesRes.type === 'error') {
    return (
      <ErrorBoundary
        error={
          {
            name: 'Templates Error',
            message: templatesRes.message,
          } satisfies Error
        }
        description={'Could not load sandboxes'}
      />
    )
  }

  const sandboxes = sandboxesRes.data
  const templates = templatesRes.data

  return <SandboxesTable sandboxes={sandboxes} templates={templates} />
}
