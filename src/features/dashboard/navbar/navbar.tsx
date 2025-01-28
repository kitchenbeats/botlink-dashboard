"use client";

import { DashboardNavLink } from "@/configs/dashboard-navs";
import { MAIN_DASHBOARD_LINKS } from "@/configs/dashboard-navs";
import { useMetadataStore } from "@/lib/stores/metadata-store";
import { cn } from "@/lib/utils";
import ClientOnly from "@/ui/client-only";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useMemo } from "react";

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
  const pathname = usePathname();
  const params = useParams();
  const { selectedTeamId } = useMetadataStore();

  const groupedNavLinks = useMemo(
    () => createGroupedLinks(MAIN_DASHBOARD_LINKS),
    [],
  );

  return (
    <ClientOnly>
      <nav className={cn("relative h-full", className)}>
        <div>
          {Object.entries(groupedNavLinks).map(([group, links]) => (
            <div
              key={group}
              className="mt-6 flex w-full flex-col gap-1 first:mt-0"
            >
              {group !== "ungrouped" && (
                <div className="mb-2 ml-1 font-mono text-xs uppercase text-fg-300">
                  {group}
                </div>
              )}
              {links.map((item) => (
                <div key={item.label} className="w-full">
                  <Link
                    prefetch={false}
                    href={item.href({ teamId: selectedTeamId ?? undefined })}
                    suppressHydrationWarning
                    className={cn(
                      "group flex w-full items-center rounded-md font-mono text-sm hover:no-underline",
                      pathname ===
                        item.href({
                          teamId: params.teamId as string | undefined,
                        })
                        ? "bg-accent/10 text-accent"
                        : "text-fg-500 hover:text-fg-300",
                    )}
                  >
                    <div className="flex w-full items-center gap-1 px-2 py-1">
                      <item.icon
                        className={cn(
                          "mr-2 w-4 text-fg-300",
                          pathname ===
                            item.href({
                              teamId: params.teamId as string | undefined,
                            })
                            ? "text-accent"
                            : "text-fg-300",
                        )}
                      />
                      <span className="shrink-0">{item.label}</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ))}
        </div>
      </nav>
    </ClientOnly>
  );
}
