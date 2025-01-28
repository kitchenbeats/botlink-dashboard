import LogoWithoutText from "@/ui/logo-without-text";
import DashboardSearch from "@/features/dashboard/sidebar/search";
import { MAIN_DASHBOARD_LINKS } from "@/configs/dashboard-navs";
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="relative flex h-svh w-[var(--protected-sidebar-width)] min-w-[var(--protected-sidebar-width)] flex-col border-r">
      <header className="flex h-[var(--protected-nav-height)] w-full items-center justify-between border-b pr-2">
        <span className="inline-flex items-center">
          <LogoWithoutText className="size-12" />
          <span className="font-mono text-xs text-fg-300">E2B</span>
        </span>
      </header>

      <div className="p-3">
        <DashboardSearch />
      </div>

      <nav className="flex flex-col gap-2 p-3">
        {MAIN_DASHBOARD_LINKS.map((link) => (
          <Link
            prefetch
            key={link.label}
            href={link.href({ teamId: "14c311de-3b0a-4bfc-89da-43a118c7582e" })}
            className="rounded-md bg-accent/10 p-2"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/*       <Suspense fallback={<Loader />}>
        <DashboardNavbar className="flex-1 p-2 pt-0" />
      </Suspense>

      <footer className="flex flex-col gap-2 p-3">
        <Suspense fallback={<Loader />}>
          <TeamSelector />
        </Suspense>
      </footer> */}
    </aside>
  );
}
