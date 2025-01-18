"use client";

import DashboardPageLayout from "@/components/dashboard/dashboard-page-layout";
import { NameSettings } from "@/components/dashboard/account/account-name-settings";
import { EmailSettings } from "@/components/dashboard/account/account-email-settings";
import { PasswordSettings } from "@/components/dashboard/account/account-password-settings";
import { DangerZone } from "@/components/dashboard/account/account-danger-zone";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";

export default function AccountPageClient() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <DashboardPageLayout title="Account">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-12 gap-6">
          <div className={cn("col-span-full")}>
            <NameSettings />
          </div>

          <div className={cn("col-span-full")}>
            <EmailSettings />
          </div>

          <div className={cn("col-span-6")}>
            <PasswordSettings />
          </div>

          <div className={cn("col-span-6 h-min")}>
            <DangerZone />
          </div>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
