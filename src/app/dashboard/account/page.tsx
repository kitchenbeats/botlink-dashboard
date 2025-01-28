import DashboardPageLayout from "@/features/dashboard/page-layout";
import { NameSettings } from "@/features/dashboard/account/name-settings";
import { EmailSettings } from "@/features/dashboard/account/email-settings";
import { PasswordSettings } from "@/features/dashboard/account/password-settings";
import { DangerZone } from "@/features/dashboard/account/danger-zone";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

export const experimental_ppr = true;

export default async function AccountPage() {
  "use cache";

  return (
    <DashboardPageLayout title="Account">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-12 gap-6">
          <div className={cn("col-span-full")}>
            <Suspense fallback={null}>
              <NameSettings />
            </Suspense>
          </div>

          <div className={cn("col-span-full")}>
            <Suspense fallback={null}>
              <EmailSettings />
            </Suspense>
          </div>

          <div className={cn("col-span-6")}>
            <Suspense fallback={null}>
              <PasswordSettings />
            </Suspense>
          </div>

          <div className={cn("col-span-6 h-min")}>
            <Suspense fallback={null}>
              <DangerZone />
            </Suspense>
          </div>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
