"use client";

import { DashboardNavLink } from "@/configs/dashboard-navs";
import { MAIN_DASHBOARD_LINKS } from "@/configs/dashboard-navs";
import { cn } from "@/lib/utils";
import { NavbarItem } from "./navbar-item";
import { useMetadataStore } from "@/lib/stores/metadata-store";

type GroupedLinks = {
  [key: string]: DashboardNavLink[];
};

const createGroupedLinks = (links: DashboardNavLink[]): GroupedLinks => {
  return links.reduce((acc, link) => {
    const group = link.group || "ungrouped";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(link);
    return acc;
  }, {} as GroupedLinks);
};

interface DashboardNavbarProps {
  className?: string;
}

export default function DashboardNavbar({ className }: DashboardNavbarProps) {
  const selectedTeamId = useMetadataStore((state) => state.selectedTeamId);

  const groupedNavLinks = createGroupedLinks(MAIN_DASHBOARD_LINKS);

  return (
    <nav className={cn("relative h-full", className)}>
      {Object.entries(groupedNavLinks).map(([group, links]) => (
        <div key={group} className="mt-6 flex w-full flex-col gap-1 first:mt-0">
          {group !== "ungrouped" && (
            <span className="mb-2 ml-1 font-mono text-xs uppercase text-fg-300">
              {group}
            </span>
          )}
          {links.map((item) => (
            <NavbarItem
              key={item.label}
              label={item.label}
              href={item.href({ teamId: selectedTeamId ?? undefined })}
              icon={item.icon}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}
