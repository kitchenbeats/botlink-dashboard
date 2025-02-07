import {
  BarChart,
  Blocks,
  CreditCard,
  DollarSign,
  Key,
  LucideProps,
  LucideSheet,
  User,
  Users,
} from 'lucide-react'
import { ForwardRefExoticComponent, RefAttributes } from 'react'

type DashboardNavLinkArgs = {
  teamIdOrSlug?: string
}

export type DashboardNavLink = {
  label: string
  href: (args: DashboardNavLinkArgs) => string
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >
  group?: string
  goesDeeper?: boolean
}

export const MAIN_DASHBOARD_LINKS: DashboardNavLink[] = [
  {
    label: 'Sandboxes',
    href: (args) => `/dashboard/${args.teamIdOrSlug}/sandboxes`,
    icon: Blocks,
  },
  {
    label: 'Templates',
    href: (args) => `/dashboard/${args.teamIdOrSlug}/templates`,
    icon: LucideSheet,
  },
  {
    label: 'Usage',
    href: (args) => `/dashboard/${args.teamIdOrSlug}/usage`,
    icon: BarChart,
  },

  {
    label: 'General',
    href: (args) => `/dashboard/${args.teamIdOrSlug}/general`,
    icon: Users,
    group: 'team',
  },
  {
    label: 'API Keys',
    href: (args) => `/dashboard/${args.teamIdOrSlug}/keys`,
    icon: Key,
    group: 'team',
  },
  {
    label: 'Billing',
    href: (args) => `/dashboard/${args.teamIdOrSlug}/billing`,
    icon: CreditCard,
    group: 'team',
  },
  {
    label: 'Budget',
    href: (args) => `/dashboard/${args.teamIdOrSlug}/budget`,
    icon: DollarSign,
    group: 'team',
  },

  {
    label: 'Account',
    href: () => `/dashboard/account`,
    icon: User,
    group: 'personal',
  },
]
