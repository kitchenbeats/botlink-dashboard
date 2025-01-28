import {
  BarChart,
  Blocks,
  Code,
  CreditCard,
  Key,
  LucideSheet,
  Settings,
  User,
  Users,
} from "lucide-react";
import { ForwardRefExoticComponent } from "react";

type DashboardNavLinkArgs = {
  teamId?: string;
};

export type DashboardNavLink = {
  label: string;
  href: (args: DashboardNavLinkArgs) => string;
  icon: ForwardRefExoticComponent<any>;
  group?: string;
  goesDeeper?: boolean;
};

export const MAIN_DASHBOARD_LINKS: DashboardNavLink[] = [
  /*   {
    label: "Home",
    href: (args) => `/dashboard/${args.teamId}`,
    icon: HomeIcon,
  }, */
  {
    label: "Sandboxes",
    href: (args) => `/dashboard/${args.teamId}/sandboxes`,
    icon: Blocks,
  },
  {
    label: "Templates",
    href: (args) => `/dashboard/${args.teamId}/templates`,
    icon: LucideSheet,
  },
  {
    label: "Usage",
    href: (args) => `/dashboard/${args.teamId}/usage`,
    icon: BarChart,
  },

  {
    label: "General",
    href: (args) => `/dashboard/${args.teamId}/settings/general`,
    icon: Users,
    group: "team",
  },
  {
    label: "API Keys",
    href: (args) => `/dashboard/${args.teamId}/settings/keys`,
    icon: Key,
    group: "team",
  },
  {
    label: "Billing",
    href: (args) => `/dashboard/${args.teamId}/settings/billing`,
    icon: CreditCard,
    group: "team",
  },

  {
    label: "Account",
    href: () => `/dashboard/account`,
    icon: User,
    group: "personal",
  },
];
