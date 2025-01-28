import { ThemeSwitcher } from "@/ui/theme-switcher";
import { cn } from "@/lib/utils";
import UserMenu from "@/features/auth/user-menu";
import { Suspense } from "react";

interface DashboardPageLayoutProps {
  children: React.ReactNode;
  title: string;
  className?: string;
  fullscreen?: boolean;
}

export default function DashboardPageLayout({
  children,
  title,
  className,
  fullscreen = false,
}: DashboardPageLayoutProps) {
  return (
    <div className="relative flex h-svh">
      <div className="absolute inset-x-0 top-0 z-10 flex h-[var(--protected-nav-height)] border-b bg-bg px-3">
        <div className="flex w-full items-center gap-2">
          <h2 className="mr-auto text-lg font-bold">{title}</h2>

          <Suspense fallback={null}>
            <ThemeSwitcher />
          </Suspense>
          <Suspense fallback={null}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
      <div
        className={cn(
          "relative z-0 mt-[var(--protected-nav-height)] flex-1",
          fullscreen ? "overflow-hidden" : "overflow-y-auto",
        )}
      >
        {fullscreen ? (
          <div className="h-full">{children}</div>
        ) : (
          <div className={cn("max-w-[1400px] p-3", className)}>{children}</div>
        )}
      </div>
    </div>
  );
}
