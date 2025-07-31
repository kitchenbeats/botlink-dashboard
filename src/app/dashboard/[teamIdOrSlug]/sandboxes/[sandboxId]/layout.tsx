import { SandboxProvider } from '@/features/dashboard/sandbox/context'
import SandboxDetailsHeader from '@/features/dashboard/sandbox/header/header'
import SandboxLayoutClient from '@/features/dashboard/sandbox/layout'
import { resolveTeamIdInServerComponent } from '@/lib/utils/server'
import { getSandboxDetails } from '@/server/sandboxes/get-sandbox-details'

export const fetchCache = 'force-no-store'

interface SandboxLayoutProps {
  children: React.ReactNode
  params: Promise<{ teamIdOrSlug: string; sandboxId: string }>
}

export default async function SandboxLayout({
  children,
  params,
}: SandboxLayoutProps) {
  const { teamIdOrSlug, sandboxId } = await params

  const teamId = await resolveTeamIdInServerComponent(teamIdOrSlug)
  const res = await getSandboxDetails({ teamId, sandboxId })

  const exists = res?.serverError !== 'SANDBOX_NOT_FOUND'

  if (!res?.data || res?.serverError) {
    console.error(
      'SANDBOX_DETAILS_LAYOUT',
      res?.serverError || 'Unknown error',
      res?.data
    )
  }

  return (
    <SandboxProvider
      teamId={teamId}
      serverSandboxInfo={res?.data}
      isRunning={exists}
    >
      <SandboxLayoutClient
        teamIdOrSlug={teamIdOrSlug}
        header={
          <SandboxDetailsHeader
            teamIdOrSlug={teamIdOrSlug}
            state={exists ? 'running' : 'paused'}
          />
        }
      >
        {children}
      </SandboxLayoutClient>
    </SandboxProvider>
  )
}
