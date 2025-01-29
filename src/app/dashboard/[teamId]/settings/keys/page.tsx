import ApiKeysTable from "@/features/dashboard/keys/table";
import CreateApiKeyDialog from "@/features/dashboard/keys/create-api-key-dialog";
import { Button } from "@/ui/primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/primitives/card";
import { Suspense } from "react";
import DashboardPageLayout from "@/features/dashboard/page-layout";

interface KeysPageClientProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default async function KeysPage({ params }: KeysPageClientProps) {
  const { teamId } = await params;

  return (
    <DashboardPageLayout title="API Keys">
      <div className="flex flex-col gap-6">
        <Card hideUnderline className="relative">
          <CardHeader>
            <CardTitle>Manage Organization Keys</CardTitle>
            <CardDescription>
              Organization keys are used to authenticate API requests from your
              organization's applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={null}>
              <CreateApiKeyDialog teamId={teamId}>
                <Button className="absolute right-6 top-6">CREATE KEY</Button>
              </CreateApiKeyDialog>
            </Suspense>
            <ApiKeysTable teamId={teamId} />
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  );
}
