import { getTeamMetadataFromCookiesMemo } from '@/lib/utils/server'
import { getTeam } from '@/server/team/get-team'
import TeamGateClient from './team-gate.client'

interface TeamGateProps {
  children: React.ReactNode
  /**
   * The team identifier taken from the route param. When missing we will only
   * validate against the cookies.
   */
  params: Promise<{ teamIdOrSlug: string }>
}

/**
 * A thin server‐component guard that ensures valid team metadata exists before
 * rendering its children. It keeps expensive team-resolution logic out of the
 * main dashboard layout so that the HTML shell can stream instantly.
 *
 * If validation fails it will redirect to the dashboard root where global
 * middleware / route handler will pick the appropriate fallback.
 */
export default async function TeamGate({ children, params }: TeamGateProps) {
  const { teamIdOrSlug } = await params

  const { id: teamId } = await getTeamMetadataFromCookiesMemo(teamIdOrSlug)

  const res = await getTeam({ teamId })

  return (
    <TeamGateClient initialTeam={res?.data || null}>{children}</TeamGateClient>
  )
}
