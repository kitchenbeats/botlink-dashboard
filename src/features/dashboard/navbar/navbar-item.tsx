'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Dotted from '@/ui/dotted'

interface NavbarItemProps {
  label: string
  href: string
  icon: React.ReactNode
}

export function NavbarItem({ label, href, icon }: NavbarItemProps) {
  const pathname = usePathname()

  return (
    <Link
      prefetch
      href={href}
      suppressHydrationWarning
      className={cn(
        'group relative w-full ring-border transition-all duration-200 hover:no-underline hover:ring-1',
        pathname === href ? 'text-accent' : 'text-fg-300 hover:text-fg'
      )}
    >
      <Dotted className="z-0" />
      <div
        className={cn(
          'relative z-10 bg-bg ring-border transition-all duration-200',
          'group-hover:-translate-y-[4px] group-hover:scale-[1.005] group-hover:shadow-sm group-hover:ring-1 dark:group-hover:shadow-md'
        )}
      >
        <div className="flex w-full items-center bg-bg font-mono text-sm">
          <div className="flex w-full items-center gap-1 px-2 py-1">
            {icon}
            <span className="shrink-0">{label}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
