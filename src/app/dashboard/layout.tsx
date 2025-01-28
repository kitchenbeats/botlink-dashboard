import Sidebar from "@/features/dashboard/sidebar/sidebar";
import NetworkStateBanner from "@/ui/network-state-banner";
import { DashboardTitleProvider } from "@/features/dashboard/dashboard-title-provider";
import TeamProvider from "@/features/dashboard/team-provider";
import { Suspense } from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  "use cache";

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
          <TeamProvider />
        </Suspense>
      </div>
    </div>
  );
}
