import LoadingLayout from "@/features/dashboard/loading-layout";
import DashboardPageLayout from "@/features/dashboard/page-layout";
import SandboxesTable from "@/features/dashboard/sandboxes/table";
import { bailOutFromPPR } from "@/lib/utils/server";
import { getTeamSandboxes } from "@/server/sandboxes/get-team-sandboxes";
import { getTeamTemplates } from "@/server/templates/get-templates";
import ClientOnly from "@/ui/client-only";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { teamId } = await params;

  return (
    <DashboardPageLayout title="Running Sandboxes" fullscreen>
      <Suspense fallback={<LoadingLayout />}>
        <PageContent teamId={teamId} />
      </Suspense>
    </DashboardPageLayout>
  );
}

interface PageContentProps {
  teamId: string;
}

async function PageContent({ teamId }: PageContentProps) {
  bailOutFromPPR();

  try {
    const [sandboxesRes, templatesRes] = await Promise.all([
      getTeamSandboxes({ teamId }),
      getTeamTemplates({ teamId }),
    ]);

    if (sandboxesRes.type === "error") {
      throw new Error(sandboxesRes.message);
    }

    if (templatesRes.type === "error") {
      throw new Error(templatesRes.message);
    }

    const sandboxes = sandboxesRes.data;
    const templates = templatesRes.data;

    return (
      <ClientOnly>
        <SandboxesTable sandboxes={sandboxes} templates={templates} />
      </ClientOnly>
    );
  } catch (error) {
    return <div>Error loading sandboxes.</div>;
  }
}
