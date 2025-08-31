import { COOKIE_KEYS } from '@/configs/keys'
import DashboardLayoutView from '@/features/dashboard/layout/layout'
import { ServerContextProvider } from '@/features/dashboard/server-context'
import Sidebar from '@/features/dashboard/sidebar/sidebar'
import { getSessionInsecure } from '@/server/auth/get-session'
import { getUserTeams } from '@/server/team/get-team'
import { SidebarInset } from '@/ui/primitives/sidebar'
import { cookies } from 'next/headers'

interface ServerContextWrapperProps {
  children: React.ReactNode
}

export default async function ServerContextWrapper({
  children,
}: ServerContextWrapperProps) {
  // This code runs on the server per request (not cached via static).

  const cookieStore = await cookies()
  const teamId = cookieStore.get(COOKIE_KEYS.SELECTED_TEAM_ID)?.value || null
  const teamSlug =
    cookieStore.get(COOKIE_KEYS.SELECTED_TEAM_SLUG)?.value || null

  const teamMetadata = teamId ? { id: teamId, slug: teamSlug } : null

  const session = await getSessionInsecure()
  const res = await getUserTeams()

  // In case of failures we just render children without provider; sidebar will handle gracefully
  if (!res?.data || res.serverError || !session?.user) {
    return <DashboardLayoutView>{children}</DashboardLayoutView>
  }

  const selectedTeam = res.data.find((t) => t.id === teamId) ?? null

  return (
    <ServerContextProvider
      teamId={teamMetadata?.id || null}
      teamSlug={teamMetadata?.slug || null}
      teams={res.data}
      selectedTeam={selectedTeam}
      user={session.user}
    >
      <Sidebar />
      <SidebarInset>
        <DashboardLayoutView>{children}</DashboardLayoutView>
      </SidebarInset>
    </ServerContextProvider>
  )
}
