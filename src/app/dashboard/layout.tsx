import Sidebar from "@/features/dashboard/sidebar/sidebar";
import NetworkStateBanner from "@/ui/network-state-banner";
import { DashboardTitleProvider } from "@/features/dashboard/dashboard-title-provider";
import TeamProvider from "@/features/dashboard/team-provider";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { COOKIE_KEYS } from "@/configs/keys";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const cookieStore = await cookies();
  const selectedTeamId = cookieStore.get(COOKIE_KEYS.SELECTED_TEAM_ID)?.value;

  return (
    <div className="mx-auto flex h-svh max-h-full w-full flex-col">
      <NetworkStateBanner />
      <div className="flex h-full max-h-full w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1">{children}</main>
        <Suspense fallback={null}>
          <DashboardTitleProvider />
        </Suspense>
        <Suspense fallback={null}>
          <TeamProvider initialTeamId={selectedTeamId} />
        </Suspense>
      </div>
    </div>
  );
}
