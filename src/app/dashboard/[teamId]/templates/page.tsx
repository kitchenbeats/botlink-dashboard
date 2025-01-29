import DashboardPageLayout from "@/features/dashboard/page-layout";
import TemplatesTable from "@/features/dashboard/templates/table";
import { getTeamTemplates } from "@/server/templates/get-templates";
import ClientOnly from "@/ui/client-only";
import { Suspense } from "react";
import LoadingLayout from "../../loading";

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
  try {
    const res = await getTeamTemplates({
      teamId,
    });

    if (res.type === "error") {
      throw new Error(res.message);
    }

    const templates = res.data;

    return (
      <ClientOnly>
        <TemplatesTable templates={templates} />
      </ClientOnly>
    );
  } catch (error) {
    return <div>Error loading templates.</div>;
  }
}
