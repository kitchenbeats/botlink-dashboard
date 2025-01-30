import LogoWithoutText from "@/ui/logo-without-text";
import DashboardSearch from "@/features/dashboard/sidebar/search";
import { Suspense } from "react";
import DashboardNavbar from "../navbar/navbar";
import TeamSelector from "./team-selector";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "relative flex h-svh w-[var(--protected-sidebar-width)] min-w-[var(--protected-sidebar-width)] flex-col border-r",
        className,
      )}
    >
      <header className="flex h-[var(--protected-nav-height)] w-full items-center justify-between border-b pr-2">
        <span className="inline-flex items-center">
          <LogoWithoutText className="size-12" />
          <span className="font-mono text-xs text-fg-300">E2B</span>
        </span>
      </header>

      <div className="p-3">
        <Suspense fallback={null}>
          <DashboardSearch />
        </Suspense>
      </div>

      <DashboardNavbar className="flex-1 p-2 pt-0" />

      <footer className="mt-auto p-3">
        <Suspense fallback={null}>
          <TeamSelector />
        </Suspense>
      </footer>
    </aside>
  );
}
