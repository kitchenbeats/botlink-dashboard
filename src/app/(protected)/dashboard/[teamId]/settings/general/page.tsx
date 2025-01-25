import DashboardPageLayout from "@/features/dashboard/layout/page-layout";
import { TeamSettingsForm } from "@/features/dashboard/team/settings-form";
import { MemberManagement } from "@/features/dashboard/team/member-management";
import { DangerZone } from "@/features/dashboard/team/danger-zone";
import { Suspense } from "react";

export default function GeneralPage() {
  return (
    <Suspense>
      <DashboardPageLayout title="General">
        <div className="flex flex-col gap-6">
          <TeamSettingsForm />
          <MemberManagement />
          <DangerZone />
        </div>
      </DashboardPageLayout>
    </Suspense>
  );
}
