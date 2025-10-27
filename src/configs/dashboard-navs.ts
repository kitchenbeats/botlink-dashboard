import {
  Activity,
  Box,
  Container,
  CreditCard,
  DollarSign,
  Key,
  LucideProps,
  UserRoundCog,
  Users,
  FolderKanban,
  Code2,
  Bot,
  GitBranch,
  History,
  Shield,
} from 'lucide-react'
import { ForwardRefExoticComponent, RefAttributes } from 'react'
import { INCLUDE_BILLING } from './flags'
import { PROTECTED_URLS } from './urls'

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
  activeMatch?: string
}

export const MAIN_DASHBOARD_LINKS: DashboardNavLink[] = [
  {
    label: 'Projects',
    href: (args) => PROTECTED_URLS.PROJECTS(args.teamIdOrSlug!),
    icon: FolderKanban,
    group: 'build',
    activeMatch: `/dashboard/*/projects/**`,
  },
  {
    label: 'Agents',
    href: (args) => PROTECTED_URLS.AGENTS(args.teamIdOrSlug!),
    icon: Bot,
    group: 'build',
    activeMatch: `/dashboard/*/agents/**`,
  },
  {
    label: 'Workflows',
    href: (args) => PROTECTED_URLS.WORKFLOWS(args.teamIdOrSlug!),
    icon: GitBranch,
    group: 'build',
    activeMatch: `/dashboard/*/workflows/**`,
  },
  {
    label: 'Executions',
    href: (args) => PROTECTED_URLS.EXECUTIONS(args.teamIdOrSlug!),
    icon: History,
    group: 'build',
    activeMatch: `/dashboard/*/executions/**`,
  },
  {
    label: 'Sandboxes',
    href: (args) => PROTECTED_URLS.SANDBOXES(args.teamIdOrSlug!),
    icon: Box,
    group: 'infrastructure',
    activeMatch: `/dashboard/*/sandboxes/**`,
  },
  {
    label: 'Templates',
    href: (args) => PROTECTED_URLS.TEMPLATES(args.teamIdOrSlug!),
    icon: Container,
    group: 'infrastructure',
    activeMatch: `/dashboard/*/templates`,
  },
  ...(INCLUDE_BILLING
    ? [
        {
          label: 'Usage',
          href: (args: DashboardNavLinkArgs) =>
            PROTECTED_URLS.USAGE(args.teamIdOrSlug!),
          icon: Activity,
          activeMatch: `/dashboard/*/usage/**`,
        },
      ]
    : []),
  {
    label: 'Team',
    href: (args) => PROTECTED_URLS.TEAM(args.teamIdOrSlug!),
    icon: Users,
    group: 'manage',
    activeMatch: `/dashboard/*/team/**`,
  },
  {
    label: 'API Keys',
    href: (args) => PROTECTED_URLS.KEYS(args.teamIdOrSlug!),
    icon: Key,
    group: 'manage',
    activeMatch: `/dashboard/*/keys/**`,
  },

  ...(INCLUDE_BILLING
    ? [
        {
          label: 'Billing',
          href: (args: DashboardNavLinkArgs) =>
            PROTECTED_URLS.BILLING(args.teamIdOrSlug!),
          icon: CreditCard,
          group: 'expenses',
          activeMatch: `/dashboard/*/billing/**`,
        },
        {
          label: 'Budget',
          href: (args: DashboardNavLinkArgs) =>
            PROTECTED_URLS.BUDGET(args.teamIdOrSlug!),
          group: 'expenses',
          icon: DollarSign,
          activeMatch: `/dashboard/*/budget/**`,
        },
      ]
    : []),
]

export const EXTRA_DASHBOARD_LINKS: DashboardNavLink[] = [
  {
    label: 'Account Settings',
    href: (args) => PROTECTED_URLS.ACCOUNT_SETTINGS,
    icon: UserRoundCog,
  },
]

export const ADMIN_DASHBOARD_LINKS: DashboardNavLink[] = [
  {
    label: 'Admin',
    href: (args) => PROTECTED_URLS.ADMIN,
    icon: Shield,
    group: 'admin',
    activeMatch: '/dashboard/admin/**',
  },
]

export const ALL_DASHBOARD_LINKS = [
  ...MAIN_DASHBOARD_LINKS,
  ...EXTRA_DASHBOARD_LINKS,
]
