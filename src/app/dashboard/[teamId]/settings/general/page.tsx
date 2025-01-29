import DashboardPageLayout from "@/features/dashboard/page-layout";
import { TeamSettingsForm } from "@/features/dashboard/team/settings-form";
import { MemberManagement } from "@/features/dashboard/team/member-management";
import { Suspense } from "react";

interface GeneralPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default async function GeneralPage({ params }: GeneralPageProps) {
  const { teamId } = await params;

  return (
    <DashboardPageLayout title="General" className="flex flex-col gap-6">
      <Suspense fallback={null}>
        <TeamSettingsForm />
      </Suspense>
      <MemberManagement teamId={teamId} />
      {/* <DangerZone teamId={teamId} /> */}
    </DashboardPageLayout>
  );
}
