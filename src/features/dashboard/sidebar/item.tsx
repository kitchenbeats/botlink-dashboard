'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Dotted from '@/ui/dotted'

interface SidebarItemProps {
  label: React.ReactNode
  href: string
  icon: React.ReactNode
}

export function SidebarItem({ label, href, icon }: SidebarItemProps) {
  const pathname = usePathname()

  return (
    <Link
      prefetch
      href={href}
      suppressHydrationWarning
      className={cn(
        'group ring-border relative w-full overflow-hidden transition-all duration-150 hover:no-underline hover:ring-1'
      )}
    >
      <Dotted className="z-0" />
      <div
        className={cn(
          'bg-bg ring-border relative z-10 transition-all duration-150',
          'group-hover:-translate-y-[4px] group-hover:scale-[1.005] group-hover:shadow-sm group-hover:ring-1 dark:group-hover:shadow-md'
        )}
      >
        <div className="bg-bg flex w-full items-center font-mono text-sm">
          <div
            className={cn(
              'flex w-full items-center gap-1 px-2 py-1',
              pathname === href ? 'text-accent' : 'text-fg-300 hover:text-fg'
            )}
          >
            {icon}
            <span className="shrink-0">{label}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
