import LogoWithoutText from '@/ui/logo-without-text'
import DashboardSearch from '@/features/dashboard/sidebar/search'
import { Suspense } from 'react'
import DashboardNavbar from '../navbar/navbar'
import TeamSelector from './team-selector'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/primitives/button'
import {
  ArrowBigRight,
  ArrowBigRightDash,
  Book,
  ChevronRight,
  Cog,
  Construction,
  Github,
  MoveRight,
  Settings2,
  SidebarOpenIcon,
} from 'lucide-react'
import Link from 'next/link'
import ExternalIcon from '@/ui/external-icon'
import { GITHUB_URL } from '@/configs/socials'
import { PROTECTED_URLS } from '@/configs/urls'
import UserDetailsTile from '@/features/auth/user-details-tile'
import { getSessionInsecure } from '@/server/auth/get-session'
import DeveloperSettingsDialog from '../developer-settings/settings-dialog'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'relative flex h-svh w-[var(--protected-sidebar-width)] min-w-[var(--protected-sidebar-width)] flex-col border-r',
        className
      )}
    >
      <header className="mb-2 flex w-full flex-col items-center justify-between border-b border-dashed">
        <div className="flex h-[var(--protected-nav-height)] w-full justify-center border-b">
          <LogoWithoutText className="size-12" />
        </div>

        <div className="w-full p-2">
          <Suspense fallback={null}>
            <TeamSelector className="pl-1 pr-2" />
          </Suspense>
        </div>
      </header>

      <DashboardNavbar className="flex-1 p-2 pb-8 pt-0" />

      <div className="w-full p-2">
        <Suspense fallback={null}>
          <DashboardSearch className="w-full" />
        </Suspense>
      </div>
      <footer className="mt-auto flex flex-col bg-bg-100">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center gap-2 border-t p-2 text-sm text-fg-300 hover:text-fg"
        >
          <Github className="size-4 text-fg-500" />
          GitHub
          <ExternalIcon className="ml-auto size-4" />
        </a>
        <Link
          prefetch={false}
          href="/docs"
          target="_blank"
          className="flex w-full items-center gap-2 border-t p-2 text-sm text-fg-300 hover:text-fg"
        >
          <Book className="size-4 text-fg-500" />
          Documentation
          <ExternalIcon className="ml-auto size-4" />
        </Link>
        <Suspense>
          <DeveloperSettingsDialog>
            <Button
              variant="ghost"
              className="flex w-full items-center justify-start gap-2 rounded-none border-t p-2 font-sans text-sm normal-case text-fg-300 hover:text-fg"
            >
              <Construction className="size-4 text-fg-500" />
              Developer Settings
            </Button>
          </DeveloperSettingsDialog>
        </Suspense>
        <Suspense fallback={null}>
          <UserMenuWrapper />
        </Suspense>
      </footer>
    </aside>
  )
}

async function UserMenuWrapper() {
  const session = await getSessionInsecure()

  // TODO: Add Developer Settings
  /*   const apiDomain = (await cookies()).get(COOKIE_KEYS.API_DOMAIN)?.value */

  return <UserDetailsTile user={session!.user} className="w-full border-t" />
}
