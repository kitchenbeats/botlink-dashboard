import { DashboardNavLink } from '@/configs/dashboard-navs'
import { MAIN_DASHBOARD_LINKS } from '@/configs/dashboard-navs'
import { cn } from '@/lib/utils'
import { NavbarItem } from './navbar-item'
import { cookies } from 'next/headers'
import { COOKIE_KEYS } from '@/configs/keys'

type GroupedLinks = {
  [key: string]: DashboardNavLink[]
}

const createGroupedLinks = (links: DashboardNavLink[]): GroupedLinks => {
  return links.reduce((acc, link) => {
    const group = link.group || 'ungrouped'
    if (!acc[group]) {
      acc[group] = []
    }
    acc[group].push(link)
    return acc
  }, {} as GroupedLinks)
}

interface DashboardNavbarProps {
  className?: string
}

export default async function DashboardNavbar({
  className,
}: DashboardNavbarProps) {
  const cookiesStore = await cookies()

  const selectedTeamIdentifier =
    cookiesStore.get(COOKIE_KEYS.SELECTED_TEAM_SLUG)?.value ||
    cookiesStore.get(COOKIE_KEYS.SELECTED_TEAM_ID)?.value

  const groupedNavLinks = createGroupedLinks(MAIN_DASHBOARD_LINKS)

  return (
    <nav className={cn('relative h-full', className)}>
      {Object.entries(groupedNavLinks).map(([group, links]) => (
        <div key={group} className="mt-6 flex w-full flex-col gap-1 first:mt-0">
          {group !== 'ungrouped' && (
            <span className="text-fg-500 mb-2 ml-2 font-mono text-xs uppercase">
              {group}
            </span>
          )}
          {links.map((item) => {
            const href = item.href({
              teamIdOrSlug: selectedTeamIdentifier ?? undefined,
            })

            return (
              <NavbarItem
                key={item.label}
                label={item.label}
                href={href}
                icon={<item.icon className={cn('text-fg-500 mr-2 w-4')} />}
              />
            )
          })}
        </div>
      ))}
    </nav>
  )
}
