"use client";

import ApiKeysTable from "@/features/dashboard/keys/api-keys-table";
import CreateApiKeyDialog from "@/features/dashboard/keys/create-api-key-dialog";
import { useMetadata } from "@/features/dashboard/metadata-provider";
import { Button } from "@/ui/primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/primitives/card";
import DashboardPageLayout from "@/features/dashboard/layout/page-layout";

export default function KeysPageClient() {
  const { selectedTeamId } = useMetadata();

  return (
    <DashboardPageLayout title="API Keys">
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
