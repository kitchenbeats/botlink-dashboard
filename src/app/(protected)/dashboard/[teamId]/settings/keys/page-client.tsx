"use client";

import ApiKeysTable from "@/components/dashboard/keys/api-keys-table";
import CreateApiKeyDialog from "@/components/dashboard/keys/create-api-key-dialog";
import { useMetadata } from "@/components/providers/metadata-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DashboardPageLayout from "@/components/dashboard/dashboard-page-layout";

export default function KeysPageClient() {
  const { selectedTeamId } = useMetadata();

  return (
    <DashboardPageLayout
      title="API Keys"
      description="Manage your organization's API keys for authentication."
    >
      <div className="flex flex-col gap-6">
        {selectedTeamId && (
          <Card hideUnderline className="relative">
            <CardHeader>
              <CardTitle>Manage Organization Keys</CardTitle>
              <CardDescription>
                Organization keys are used to authenticate API requests from
                your organization's applications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedTeamId && (
                <CreateApiKeyDialog teamId={selectedTeamId}>
                  <Button className="absolute right-6 top-6">CREATE KEY</Button>
                </CreateApiKeyDialog>
              )}
              <ApiKeysTable teamId={selectedTeamId} />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardPageLayout>
  );
}
