import {
  Activity,
  Container,
  CreditCard,
  DollarSign,
  Key,
  LucideProps,
  PackageOpen,
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
    icon: PackageOpen,
  },
  {
    label: 'Templates',
    href: (args) => `/dashboard/${args.teamIdOrSlug}/templates`,
    icon: Container,
  },
  {
    label: 'Usage',
    href: (args) => `/dashboard/${args.teamIdOrSlug}/usage`,
    icon: Activity,
  },

  {
    label: 'Team',
    href: (args) => `/dashboard/${args.teamIdOrSlug}/team`,
    icon: Users,
    group: 'manage',
  },
  {
    label: 'API Keys',
    href: (args) => `/dashboard/${args.teamIdOrSlug}/keys`,
    icon: Key,
    group: 'manage',
  },
  {
    label: 'Billing',
    href: (args) => `/dashboard/${args.teamIdOrSlug}/billing`,
    icon: CreditCard,
    group: 'expenses',
  },
  {
    label: 'Budget',
    href: (args) => `/dashboard/${args.teamIdOrSlug}/budget`,
    group: 'expenses',
    icon: DollarSign,
  },
]
