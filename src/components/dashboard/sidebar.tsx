import { HeartPulse } from "lucide-react";
import UserMenu from "../auth/user-menu";
import { ThemeSwitcher } from "../globals/theme-switcher";
import { Button } from "../ui/button";
import DashboardNav from "./dashboard-nav";
import TeamSelector from "./team-selector";
import { cn } from "@/lib/utils";
import LogoWithoutText from "../globals/logo-without-text";
import { Suspense } from "react";

export default function Sidebar() {
  return (
    <aside
      className={cn(
        "relative flex w-56 flex-col gap-3",
        "bg-gradient-to-b from-bg to-bg-100",
        "py-4 pl-4",
        "before:pointer-events-none before:absolute before:inset-0",
        "before:bg-gradient-to-b before:from-bg-200 before:from-80%",
        "before:to-transparent before:to-20%",
        "before:bg-[length:1px_22px] before:bg-right-top before:bg-repeat-y",
      )}
    >
      <span className="inline-flex items-center">
        <LogoWithoutText className="size-12" />
        <span className="font-mono text-xs text-fg-300">E2B</span>
      </span>
      <DashboardNav />

      <Suspense fallback={<></>}>
        <TeamSelector />
      </Suspense>
      <div className="flex items-center justify-between gap-2 pr-2">
        <Suspense fallback={<></>}>
          <UserMenu />
        </Suspense>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <Button variant="ghost" size="icon" className="size-8">
            <HeartPulse className="h-4 w-4 text-fg-300" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
