"use client";

import { NameSettings } from "@/features/dashboard/account/name-settings";
import { EmailSettings } from "@/features/dashboard/account/email-settings";
import { PasswordSettings } from "@/features/dashboard/account/password-settings";
import { DangerZone } from "@/features/dashboard/account/danger-zone";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/hooks/use-user";

export default function AccountPageClient() {
  const { user } = useUser();

  if (!user) return null;

  return (
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
  );
}
