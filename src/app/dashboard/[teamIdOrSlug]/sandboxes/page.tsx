import LoadingLayout from '@/features/dashboard/loading-layout'
import DashboardPageLayout from '@/features/dashboard/page-layout'
import SandboxesTable from '@/features/dashboard/sandboxes/table'
import { getTeamSandboxes } from '@/server/sandboxes/get-team-sandboxes'
import {
  getDefaultTemplates,
  getTeamTemplates,
} from '@/server/templates/get-team-templates'
import { Suspense } from 'react'
import ErrorBoundary from '@/ui/error'
import { resolveTeamIdInServerComponent } from '@/lib/utils/server'

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
  const teamId = await resolveTeamIdInServerComponent(teamIdOrSlug)

  const [sandboxesRes, templatesRes, defaultTemplateRes] = await Promise.all([
    getTeamSandboxes({ teamId }),
    getTeamTemplates({ teamId }),
    getDefaultTemplates(),
  ])

  if (
    !sandboxesRes?.data ||
    sandboxesRes?.serverError ||
    !templatesRes?.data?.templates ||
    templatesRes?.serverError
  ) {
    return (
      <ErrorBoundary
        error={
          {
            name: 'Sandboxes Error',
            message:
              sandboxesRes?.serverError ??
              templatesRes?.serverError ??
              'Unknown error',
          } satisfies Error
        }
        description={'Could not load sandboxes'}
      />
    )
  }

  const sandboxes = sandboxesRes.data
  const templates = [
    ...(defaultTemplateRes?.data?.templates
      ? defaultTemplateRes.data.templates
      : []),
    ...templatesRes.data.templates,
  ]

  return <SandboxesTable sandboxes={sandboxes} templates={templates} />
}
