import DashboardPageLayout from "@/features/dashboard/page-layout";
import TemplatesTable from "@/features/dashboard/templates/table";
import { getTeamTemplates } from "@/server/templates/get-team-templates";
import { Suspense } from "react";
import LoadingLayout from "../../loading";
import ErrorBoundary from "@/ui/error";

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
  const res = await getTeamTemplates({
    teamId,
  });

  if (res.type === "error") {
    return (
      <ErrorBoundary
        error={
          {
            name: "Templates Error",
            message: res.message,
          } satisfies Error
        }
        description={"Could not load templates"}
      />
    );
  }

  const templates = res.data;

  return <TemplatesTable templates={templates} />;
}
