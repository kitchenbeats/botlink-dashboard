'use client'

import { isActive } from '@/lib/utils/docs'
import { cn } from '@/lib/utils'
import { SidebarComponents } from 'fumadocs-ui/layouts/docs/shared'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const DocsNavItem: SidebarComponents['Item'] = ({ item }) => {
  const pathname = usePathname()
  const active = isActive(item.url, pathname, false)

  return (
    <Link
      href={item.url}
      className={cn(
        'group flex w-full items-center pl-1 font-mono text-xs text-fg-500 hover:text-fg hover:no-underline',
        active && 'text-fg'
      )}
    >
      <div className="flex w-full items-center gap-1 py-1">
        {item.icon}
        <span className="shrink-0">{item.name}</span>
      </div>
    </Link>
  )
}

export default DocsNavItem
