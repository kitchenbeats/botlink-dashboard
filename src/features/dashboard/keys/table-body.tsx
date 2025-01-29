import { getTeamApiKeys } from "@/server/keys/get-api-keys";
import { Alert, AlertDescription, AlertTitle } from "@/ui/primitives/alert";
import { TableCell, TableRow } from "@/ui/primitives/table";
import ApiKeyTableRow from "./table-row";
import { cookies } from "next/headers";
import { bailOutFromPPR } from "@/lib/utils/server";

interface TableBodyContentProps {
  teamId: string;
}

export default async function TableBodyContent({
  teamId,
}: TableBodyContentProps) {
  bailOutFromPPR();

  try {
    const result = await getTeamApiKeys({ teamId });

    if (result.type === "error") {
      throw new Error(result.message);
    }

    const { apiKeys } = result.data;

    if (apiKeys.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5}>
            <Alert className="text-left" variant="contrast2">
              <AlertTitle>No API Keys</AlertTitle>
              <AlertDescription>
                No API keys found for this team.
              </AlertDescription>
            </Alert>
          </TableCell>
        </TableRow>
      );
    }

    return (
      <>
        {apiKeys.map((key, index) => (
          <ApiKeyTableRow key={key.id} apiKey={key} index={index} />
        ))}
      </>
    );
  } catch (error) {
    console.error(error);
    return (
      <TableRow>
        <TableCell colSpan={5}>
          <Alert className="text-left" variant="contrast2">
            <AlertTitle>Failed to load API keys</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Unknown error"}
            </AlertDescription>
          </Alert>
        </TableCell>
      </TableRow>
    );
  }
}
