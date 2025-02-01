import LoadingLayout from "@/features/dashboard/loading-layout";
import DashboardPageLayout from "@/features/dashboard/page-layout";
import SandboxesTable from "@/features/dashboard/sandboxes/table";
import { bailOutFromPPR } from "@/lib/utils/server";
import { getTeamSandboxes } from "@/server/sandboxes/get-team-sandboxes";
import { getTeamTemplates } from "@/server/templates/get-templates";
import { Suspense } from "react";
import ErrorBoundary from "@/ui/error";
import { UnknownError } from "@/types/errors";

interface PageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { teamId } = await params;

  return (
    <DashboardPageLayout title="Active Sandboxes" fullscreen>
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

    return <SandboxesTable sandboxes={sandboxes} templates={templates} />;
  } catch (error) {
    if (error instanceof Error) {
      return (
        <ErrorBoundary error={error} description={"Could not load sandboxes"} />
      );
    }

    return (
      <ErrorBoundary
        error={UnknownError()}
        description={"Could not load sandboxes"}
      />
    );
  }
}
