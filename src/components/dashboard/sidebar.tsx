import { HeartPulse } from "lucide-react";
import UserMenu from "../auth/user-menu";
import { ThemeSwitcher } from "../globals/theme-switcher";
import { Button } from "../ui/button";
import DashboardNav from "./dashboard-nav";
import TeamSelector from "./team-selector";
import LogoWithoutText from "../globals/logo-without-text";
import { Suspense } from "react";

export default function Sidebar() {
  return (
    <aside className="relative flex h-svh w-64 flex-col border-r bg-gradient-to-b from-bg to-bg-100">
      <header className="flex h-[var(--protected-nav-height)] w-full items-center justify-between border-b pr-2">
        <span className="inline-flex items-center">
          <LogoWithoutText className="size-12" />
          <span className="font-mono text-xs text-fg-300">E2B</span>
        </span>
      </header>

      <Suspense fallback={<></>}>
        <DashboardNav className="flex-1 p-2" />
      </Suspense>

      <footer className="flex flex-col gap-2 p-2">
        <Suspense fallback={<></>}>
          <TeamSelector />
        </Suspense>
      </footer>
    </aside>
  );
}
