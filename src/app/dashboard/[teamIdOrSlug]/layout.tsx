import DashboardLayoutView from '@/features/dashboard/layout/layout'
import Sidebar from '@/features/dashboard/sidebar/sidebar'
import TeamGate from '@/features/dashboard/team-gate'
import { SidebarInset, SidebarProvider } from '@/ui/primitives/sidebar'

export const dynamic = 'force-static'

export interface DashboardLayoutProps {
  params: Promise<{
    teamIdOrSlug: string
  }>

  children: React.ReactNode
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="fixed inset-0 flex max-h-full min-h-0 w-full flex-col overflow-hidden">
        <div className="flex h-full max-h-full min-h-0 w-full flex-1 overflow-hidden">
          <Sidebar params={params}>
            <SidebarInset>
              <TeamGate params={params}>
                <DashboardLayoutView>{children}</DashboardLayoutView>
              </TeamGate>
            </SidebarInset>
          </Sidebar>
        </div>
      </div>
    </SidebarProvider>
  )
}
