import DashboardPageLayout from "@/features/dashboard/page-layout";
import { NameSettings } from "@/features/dashboard/account/name-settings";
import { EmailSettings } from "@/features/dashboard/account/email-settings";
import { PasswordSettings } from "@/features/dashboard/account/password-settings";
import { DangerZone } from "@/features/dashboard/account/danger-zone";
import { Suspense } from "react";

export default async function AccountPage() {
  return (
    <DashboardPageLayout
      title="Account"
      className="grid grid-cols-12 pb-6 max-md:pt-6 md:gap-6"
    >
      <Suspense fallback={null}>
        <NameSettings className="col-span-12 md:col-span-6" />
      </Suspense>

      <Suspense fallback={null}>
        <EmailSettings className="col-span-12 md:col-span-6" />
      </Suspense>

      <Suspense fallback={null}>
        <PasswordSettings className="col-span-12 md:col-span-6" />
      </Suspense>

      <Suspense fallback={null}>
        <DangerZone className="col-span-12 h-min md:col-span-6" />
      </Suspense>
    </DashboardPageLayout>
  );
}
