import Link from 'next/link'
import DocsNavLinks from './links'
import LogoWithoutText from '@/ui/logo-without-text'
import { ThemeSwitcher } from '@/ui/theme-switcher'
import { cn } from '@/lib/utils'

interface NavProps {
  className?: string
}

export function Nav({ className }: NavProps) {
  return (
    <nav
      className={cn(
        'bg-bg/70 z-50 flex h-[var(--fd-nav-height)] w-full backdrop-blur-sm',
        className
      )}
    >
      <div className="flex h-full min-w-[var(--fd-sidebar-width)] items-center justify-center">
        <Link href={'/'}>
          <LogoWithoutText className="size-12" />
        </Link>
      </div>
      <div className="flex h-full w-full items-center justify-end gap-2 border-b border-l px-4">
        <ThemeSwitcher />
        <DocsNavLinks />
      </div>
    </nav>
  )
}
