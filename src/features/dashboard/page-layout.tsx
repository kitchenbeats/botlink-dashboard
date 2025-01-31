import { ThemeSwitcher } from "@/ui/theme-switcher";
import { cn } from "@/lib/utils";
import UserMenu from "@/features/auth/user-menu";
import { Suspense } from "react";
import { createClient } from "@/lib/clients/supabase/server";
import { cookies } from "next/headers";
import { COOKIE_KEYS } from "@/configs/keys";
import { Skeleton } from "@/ui/primitives/skeleton";
import Dotted from "@/ui/dotted";
import SidebarMobile from "./sidebar/sidebar-mobile";
import Frame from "@/ui/frame";

interface DashboardPageLayoutProps {
  children: React.ReactNode;
  title: string;
  className?: string;
  fullscreen?: boolean;
  classNames?: {
    frameWrapper?: string;
  };
}

export default async function DashboardPageLayout({
  children,
  title,
  className,
  classNames,
  fullscreen = false,
}: DashboardPageLayoutProps) {
  return (
    <div className={cn("relative flex h-svh")}>
      <div className="bg-bg absolute inset-x-0 top-0 z-10 flex h-[var(--protected-nav-height)] border-b pr-3 md:pl-3">
        <div className="flex w-full items-center gap-2">
          <Suspense fallback={null}>
            <SidebarMobile className="h-full border-r px-3 md:hidden" />
          </Suspense>

          <h2 className="mr-auto text-lg font-bold">{title}</h2>

          <Suspense fallback={null}>
            <ThemeSwitcher />
          </Suspense>
          <Suspense fallback={<Skeleton className="size-8" />}>
            <UserMenuWrapper />
          </Suspense>
        </div>
      </div>

      <DesktopContent
        fullscreen={fullscreen}
        classNames={classNames}
        className={className}
      >
        {children}
      </DesktopContent>
      <MobileContent className={className}>{children}</MobileContent>
    </div>
  );
}

interface ContentProps {
  children: React.ReactNode;
  classNames?: {
    frameWrapper?: string;
  };
  className?: string;
  fullscreen?: boolean;
}

function DesktopContent({
  children,
  classNames,
  className,
  fullscreen,
}: ContentProps) {
  return (
    <div
      className={cn(
        "relative z-0 mt-[var(--protected-nav-height)] flex-1 max-md:hidden",
        fullscreen
          ? "overflow-hidden"
          : "flex justify-center overflow-y-auto p-4 xl:pt-[min(6%,200px)]",
      )}
    >
      {fullscreen ? (
        <div className={cn("h-full", className)}>{children}</div>
      ) : (
        <Frame
          classNames={{
            wrapper: cn(
              "relative flex h-fit w-full max-w-[1200px] border pb-2",
              classNames?.frameWrapper,
            ),
            frame: className,
          }}
        >
          {children}
        </Frame>
      )}
    </div>
  );
}

function MobileContent({ children, className }: ContentProps) {
  return (
    <div
      className={cn(
        "relative z-0 mt-[var(--protected-nav-height)] flex-1 md:hidden",
        className,
      )}
    >
      {children}
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
