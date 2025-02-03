import DashboardPageLayout from "@/features/dashboard/page-layout";
import TemplatesTable from "@/features/dashboard/templates/table";
import { getTeamTemplates } from "@/server/templates/get-team-templates";
import { Suspense } from "react";
import LoadingLayout from "../../loading";
import { ErrorIndicator } from "@/ui/error-indicator";
import ErrorBoundary from "@/ui/error";
import { E2BError, UnknownError } from "@/types/errors";
import { bailOutFromPPR } from "@/lib/utils/server";

interface PageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { teamId } = await params;

  return (
    <DashboardPageLayout title="Templates" fullscreen>
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
    const res = await getTeamTemplates({
      teamId,
    });

    if (res.type === "error") {
      throw new Error(res.message);
    }

    const templates = res.data;

    return <TemplatesTable templates={templates} />;
  } catch (error) {
    if (error instanceof Error) {
      return (
        <ErrorBoundary error={error} description={"Could not load templates"} />
      );
    }

    return (
      <ErrorBoundary
        error={UnknownError()}
        description={"Could not load templates"}
      />
    );
  }
}
