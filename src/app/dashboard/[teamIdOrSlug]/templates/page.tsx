import TemplatesTable from '@/features/dashboard/templates/table'
import { resolveTeamIdInServerComponent, bailOutFromPPR } from '@/lib/utils/server'
import {
  getDefaultTemplates,
  getTeamTemplates,
} from '@/server/templates/get-team-templates'
import ErrorBoundary from '@/ui/error'
import { PageSkeleton } from '@/ui/loading-skeletons'
import { Suspense } from 'react'

interface PageProps {
  params: Promise<{
    teamIdOrSlug: string
  }>
}

async function PageContent({ params }: PageProps) {
  bailOutFromPPR()

  const { teamIdOrSlug } = await params
  const teamId = await resolveTeamIdInServerComponent(teamIdOrSlug)

  const res = await getTeamTemplates({
    teamId,
  })

  const defaultRes = await getDefaultTemplates()

  if (!res?.data?.templates || res?.serverError) {
    return (
      <ErrorBoundary
        error={
          {
            name: 'Templates Error',
            message: res?.serverError ?? 'Unknown error',
          } satisfies Error
        }
        description={'Could not load templates'}
      />
    )
  }

  const templates = [
    ...res.data.templates,
    ...(defaultRes?.data?.templates ? defaultRes.data.templates : []),
  ]

  return <TemplatesTable templates={templates} />
}

export default function Page({ params }: PageProps) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  )
}
