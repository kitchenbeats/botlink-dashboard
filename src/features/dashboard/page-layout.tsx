import { ThemeSwitcher } from "@/ui/theme-switcher";
import { cn } from "@/lib/utils";
import UserMenu from "@/features/auth/user-menu";
import { Suspense } from "react";
import { createClient } from "@/lib/clients/supabase/server";
import { cookies } from "next/headers";
import { COOKIE_KEYS } from "@/configs/keys";
import { Skeleton } from "@/ui/primitives/skeleton";
import Dotted from "@/ui/dotted";

interface DashboardPageLayoutProps {
  children: React.ReactNode;
  title: string;
  className?: string;
  fullscreen?: boolean;
}

export default async function DashboardPageLayout({
  children,
  title,
  className,
  fullscreen = false,
}: DashboardPageLayoutProps) {
  return (
    <div className={cn("relative flex h-svh")}>
      <div className="absolute inset-x-0 top-0 z-10 flex h-[var(--protected-nav-height)] border-b bg-bg px-3">
        <div className="flex w-full items-center gap-2">
          <h2 className="mr-auto text-lg font-bold">{title}</h2>

          <Suspense fallback={null}>
            <ThemeSwitcher />
          </Suspense>
          <Suspense fallback={<Skeleton className="size-8" />}>
            <UserMenuWrapper />
          </Suspense>
        </div>
      </div>
      <div
        className={cn(
          "relative z-0 mt-[var(--protected-nav-height)] flex-1",
          fullscreen
            ? "overflow-hidden"
            : "flex justify-center overflow-y-auto pt-24",
        )}
      >
        {fullscreen ? (
          <div className={cn("h-full", className)}>{children}</div>
        ) : (
          <div
            className={cn(
              "relative flex h-fit w-full max-w-[1200px] border pb-2",
              className,
            )}
          >
            <Dotted />
            <div className="relative w-full scale-[1.005] border bg-bg shadow-sm dark:shadow-md">
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

async function UserMenuWrapper() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const apiDomain = (await cookies()).get(COOKIE_KEYS.API_DOMAIN)?.value;

  return <UserMenu user={user!} apiDomain={apiDomain} />;
}
