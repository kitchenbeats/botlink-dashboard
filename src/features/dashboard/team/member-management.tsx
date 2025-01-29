import MemberTable from "@/features/dashboard/team/member-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/primitives/card";
import AddMemberForm from "./add-member-form";
import { Suspense } from "react";

interface MemberManagementProps {
  teamId: string;
}

export function MemberManagement({ teamId }: MemberManagementProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>Manage your organization members.</CardDescription>
      </CardHeader>
      <CardContent className="pt-10">
        <Suspense fallback={null}>
          <AddMemberForm className="mb-6 w-1/2" />
        </Suspense>
        <MemberTable teamId={teamId} />
      </CardContent>
    </Card>
  );
}
