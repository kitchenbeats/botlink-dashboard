import LogoWithoutText from '@/ui/logo-without-text'
import DashboardSearch from '@/features/dashboard/sidebar/search'
import { Suspense } from 'react'
import DashboardNavbar from '../navbar/navbar'
import TeamSelector from './team-selector'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/primitives/button'
import { Book, Github } from 'lucide-react'
import Link from 'next/link'
import ExternalIcon from '@/ui/external-icon'
import { GITHUB_URL } from '@/configs/socials'

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
      <header className="flex h-[var(--protected-nav-height)] w-full items-center justify-between border-b pr-2">
        <LogoWithoutText className="size-12" />
      </header>

      <div className="p-3">
        <Suspense fallback={null}>
          <DashboardSearch />
        </Suspense>
      </div>

      <DashboardNavbar className="flex-1 p-2 pb-8 pt-0" />

      <footer className="mt-auto flex flex-col gap-2 p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-fg-300 hover:text-fg"
          asChild
        >
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            <Github className="size-4 text-fg-500" />
            GitHub
            <ExternalIcon className="ml-auto size-4" />
          </a>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-fg-300 hover:text-fg"
          asChild
        >
          <Link prefetch={false} href="/docs" target="_blank">
            <Book className="size-4 text-fg-500" />
            Documentation
            <ExternalIcon className="ml-auto size-4" />
          </Link>
        </Button>
        <Suspense fallback={null}>
          <TeamSelector />
        </Suspense>
      </footer>
    </aside>
  )
}
