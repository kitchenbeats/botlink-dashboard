import { Alert, AlertDescription, AlertTitle } from "@/ui/primitives/alert";
import { TableCell, TableRow } from "@/ui/primitives/table";
import MemberTableRow from "./member-table-row";
import { getTeamMembers } from "@/server/team/get-team-members";
import { bailOutFromPPR } from "@/lib/utils/server";

interface TableBodyContentProps {
  teamId: string;
}

export default async function MemberTableBody({
  teamId,
}: TableBodyContentProps) {
  bailOutFromPPR();

  try {
    const result = await getTeamMembers({ teamId });

    if (result.type === "error") {
      throw new Error(result.message);
    }

    const members = result.data;

    if (members.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5}>
            <Alert className="text-left" variant="contrast2">
              <AlertTitle>No Members</AlertTitle>
              <AlertDescription>No team members found.</AlertDescription>
            </Alert>
          </TableCell>
        </TableRow>
      );
    }

    return (
      <>
        {members.map((member, index) => (
          <MemberTableRow key={member.info.id} member={member} index={index} />
        ))}
      </>
    );
  } catch (error) {
    console.error(error);
    return (
      <TableRow>
        <TableCell colSpan={5}>
          <Alert className="text-left" variant="contrast2">
            <AlertTitle>Failed to load members</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Unknown error"}
            </AlertDescription>
          </Alert>
        </TableCell>
      </TableRow>
    );
  }
}
