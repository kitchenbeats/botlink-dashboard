import DashboardPageLayout from "@/features/dashboard/page-layout";
import { TeamSettingsForm } from "@/features/dashboard/team/settings-form";
import { MemberManagement } from "@/features/dashboard/team/member-management";
import { DangerZone } from "@/features/dashboard/team/danger-zone";

export default function GeneralPage() {
  return (
    <DashboardPageLayout title="General">
      <div className="flex flex-col gap-6">
        <TeamSettingsForm />
        <MemberManagement />
        <DangerZone />
      </div>
    </DashboardPageLayout>
  );
}
