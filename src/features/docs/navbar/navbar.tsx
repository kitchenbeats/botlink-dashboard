import Link from 'next/link'
import DocsNavLinks from './links'
import LogoWithoutText from '@/ui/logo-without-text'

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 h-[var(--fd-nav-height)] w-full border-b border-border bg-bg/70 backdrop-blur-sm">
      <div className="flex h-full w-full items-center justify-between px-4 text-sm">
        <Link href={'/'}>
          <LogoWithoutText className="size-12" />
        </Link>
        <DocsNavLinks />
      </div>
    </nav>
  )
}
