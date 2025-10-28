import { METADATA } from '@/configs/metadata'
import { DashboardTitleProvider } from '@/features/dashboard/dashboard-title-provider'
import DashboardLayoutView from '@/features/dashboard/layout/layout'
import Sidebar from '@/features/dashboard/sidebar/sidebar'
import { SidebarInset, SidebarProvider } from '@/ui/primitives/sidebar'
import { Suspense } from 'react'
import { ServerContextProvider } from '@/features/dashboard/server-context'
import { createClient } from '@/lib/clients/supabase/server'
import { getCurrentTeam, getUserTeams } from '@/lib/db/teams'
import { isAdmin } from '@/lib/auth/admin'

interface DashboardLayoutProps {
  children: React.ReactNode
  header?: React.ReactNode
}

export const metadata = {
  title: METADATA.title,
  description: METADATA.description,
  openGraph: METADATA.openGraph,
  twitter: METADATA.twitter,
  robots: 'noindex, nofollow',
}

export default async function DashboardLayout({
  children: page,
  // we are injecting server components from deeper route tree parts
  // gives access to previously unavailable props for specific pages
  // passes up the tree without breaking ssr cycle.
  //
  // read more: [@/app/dashboard/_read_me/INJECTABLES.md](@/app/dashboard/_read_me/INJECTABLES.md)
  header: headerInjectable,
}: DashboardLayoutProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get current team and all teams for context
  const currentTeam = user ? await getCurrentTeam(user.id) : null
  const allTeams = user ? await getUserTeams(user.id) : []
  const userIsAdmin = user ? (isAdmin(user.email) || isAdmin(user.id)) : false

  return (
    <ServerContextProvider
      user={user}
      currentTeam={currentTeam}
      teams={allTeams}
      isAdmin={userIsAdmin}
    >
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-dvh min-w-dvw flex max-h-full w-full flex-col overflow-hidden">
          <div className="flex h-full max-h-full min-h-0 w-full flex-1 overflow-hidden">
            <Sidebar />
            <SidebarInset>
              <DashboardLayoutView headerInjectable={headerInjectable}>
                {page}
              </DashboardLayoutView>
            </SidebarInset>
          </div>
        </div>
        <Suspense fallback={null}>
          <DashboardTitleProvider />
        </Suspense>
      </SidebarProvider>
    </ServerContextProvider>
  )
}
